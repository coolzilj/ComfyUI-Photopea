import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
import { ComfyDialog, $el } from "../../scripts/ui.js";
import { ComfyApp } from "../../scripts/app.js";
import { ClipspaceDialog } from "../../extensions/core/clipspace.js";

function addMenuHandler(nodeType, cb) {
  const getOpts = nodeType.prototype.getExtraMenuOptions;
  nodeType.prototype.getExtraMenuOptions = function () {
    const r = getOpts.apply(this, arguments);
    cb.apply(this, arguments);
    return r;
  };
}

function imageToBase64(url, callback) {
  fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64String = reader.result;
        callback(base64String);
      };
    });
}

async function uploadFile(formData) {
  try {
    const resp = await api.fetchApi('/upload/image', {
      method: 'POST',
      body: formData
    })
    if (resp.status === 200) {
      const data = await resp.json();
      ComfyApp.clipspace.imgs[ComfyApp.clipspace['selectedIndex']] = new Image();
      ComfyApp.clipspace.imgs[ComfyApp.clipspace['selectedIndex']].src = `view?filename=${data.name}&subfolder=${data.subfolder}&type=${data.type}`;
    } else {
      alert(resp.status + " - " + resp.statusText);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

class LJPhotopeaEditorDialog extends ComfyDialog {
  static instance = null;

  static getInstance() {
    if(!LJPhotopeaEditorDialog.instance) {
      LJPhotopeaEditorDialog.instance = new LJPhotopeaEditorDialog();
    }

    return LJPhotopeaEditorDialog.instance;
  }

  constructor() {
    super();
    this.element = $el("div.comfy-modal", { parent: document.body }, 
      [ $el("div.comfy-modal-content", 
        [...this.createButtons()]),
      ]);
    this.iframe = null;
    this.iframe_container = null;
  }

  createButtons() {
    return [];
  }

  createButton(name, callback) {
    var button = document.createElement("button");
    button.innerText = name;
    button.addEventListener("click", callback);
    return button;
  }

  createLeftButton(name, callback) {
    var button = this.createButton(name, callback);
    button.style.cssFloat = "left";
    button.style.marginRight = "4px";
    return button;
  }

  createRightButton(name, callback) {
    var button = this.createButton(name, callback);
    button.style.cssFloat = "right";
    button.style.marginLeft = "4px";
    return button;
  }

  setlayout() {
    const self = this;

    var bottom_panel = document.createElement("div");
    bottom_panel.style.position = "absolute";
    bottom_panel.style.bottom = "0px";
    bottom_panel.style.left = "20px";
    bottom_panel.style.right = "20px";
    bottom_panel.style.height = "50px";
    this.element.appendChild(bottom_panel);

    var cancelButton = this.createRightButton("Cancel", () => {
        self.close();
      });

    self.saveButton = this.createRightButton("Save", () => {
        self.save(self);
    });

    bottom_panel.appendChild(self.saveButton);
    bottom_panel.appendChild(cancelButton);
  }

  show() {
    if(!this.is_layout_created) {
      this.setlayout();
      this.is_layout_created = true;
    }

    if(ComfyApp.clipspace_return_node) {
      this.saveButton.innerText = "Save to node";
    }
    else {
      this.saveButton.innerText = "Save";
    }

    this.iframe = $el("iframe", {
      src: `https://www.photopea.com/`,
      style: {
        width: "100%",
        height: "100%",
        border: "none",
      },
    });

    this.iframe_container = document.createElement("div");
    this.iframe_container.style.flex = "1";
    this.element.appendChild(this.iframe_container);
    this.element.style.display = "flex";
    this.element.style.flexDirection = "column";
    this.element.style.width = "80vw";
    this.element.style.height = "80vh";
    this.element.style.paddingBottom = "70px";
    this.element.style.zIndex = 8888;
    this.iframe_container.appendChild(this.iframe);
    
    this.iframe.onload = () => { 
      const target_image_path = ComfyApp.clipspace.imgs[ComfyApp.clipspace['selectedIndex']].src;
      imageToBase64(target_image_path, (dataURL) => {
        this.postMessageToPhotopea(`app.open("${dataURL}", null, false);`, "*");
      });
    };
  }

  close() {
    this.element.removeChild(this.iframe_container);
    super.close();
  }

  async save(self) {
    const saveMessage = 'app.activeDocument.saveToOE("png");';
    const [payload, done] = await self.postMessageToPhotopea(saveMessage);
    const file = new Blob([payload], { type: "image/png" });
    const body = new FormData();

    const filename = "clipspace-photopea-" + performance.now() + ".png";

		if(ComfyApp.clipspace.widgets) {
			const index = ComfyApp.clipspace.widgets.findIndex(obj => obj.name === 'image');
			if(index >= 0)
				ComfyApp.clipspace.widgets[index].value = `photopea/${filename} [input]`;
		}

    body.append("image", file, filename);
    body.append("subfolder", "photopea");
    await uploadFile(body);

    ComfyApp.onClipspaceEditorSave();
		this.close();
  }

  async postMessageToPhotopea(message) {
    var request = new Promise(function (resolve, reject) {
        var responses = [];
        var photopeaMessageHandle = function (response) {
            responses.push(response.data);
            if (response.data == "done") {
                window.removeEventListener("message", photopeaMessageHandle);
                resolve(responses)
            }
        };
        window.addEventListener("message", photopeaMessageHandle);
    });
    this.iframe.contentWindow.postMessage(message, "*");
    return await request;
  }
}

app.registerExtension({
  name: "Comfy.LJ.PhotopeaEditor",
  init(app) {
    const callback =
      function () {
        let dlg = LJPhotopeaEditorDialog.getInstance();
        dlg.show();
      };

    const context_predicate = () => ComfyApp.clipspace && ComfyApp.clipspace.imgs && ComfyApp.clipspace.imgs.length > 0
    ClipspaceDialog.registerButton("Photopea Editor", context_predicate, callback);
  },

  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (Array.isArray(nodeData.output) && (nodeData.output.includes("MASK") || nodeData.output.includes("IMAGE"))) {
      addMenuHandler(nodeType, function (_, options) {
        options.unshift({
          content: "Open in Photopea Editor",
          callback: () => {
            ComfyApp.copyToClipspace(this);
            ComfyApp.clipspace_return_node = this;

            let dlg = LJPhotopeaEditorDialog.getInstance();
            dlg.show();
          },
        });
      });
    }
  }
});
