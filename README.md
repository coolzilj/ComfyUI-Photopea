# ComfyUI-Photopea

Edit images in the Photopea editor directly within ComfyUI.

## Installation

### Git

  ```
  cd custom_nodes
  git clone https://github.com/coolzilj/ComfyUI-Photopea.git
  ```

Restart ComfyUI and the extension should be loaded.

### ComfyUI Manager

1. Open ComfyUI and go to `Manager` > `Install Custom Nodes`.

2. Search for `ComfyUI-Photopea` in the search bar.

3. Click `Install`.

## Usage


https://github.com/coolzilj/ComfyUI-Photopea/assets/1059327/5f4c7ab3-f3b2-45e4-8130-aa9d3594ea2d


This extension adds an `Open in Photopea editor` option when you right-click on any node that has an image or mask output.  
When you click it, it loads the Photopea editor in an iframe with the image related to the node.  
You can edit the image inside Photopea, and once you're satisfied, click `Save to node` to replace the image with the edited version from Photopea.

There is also a `Photopea Editor` button in the `Clipspace` panel.

**This extension has not been extensively tested and may have bugs related to Clipspace actions. Use at your own risk.**

## Limits (Open for Discussion)

1. Each time "Open in Photopea" is clicked, Photopea opens a new document.

## Last but not lease
If you find it useful or have special needs in your workflow, I'm open to your feedback.  
Twitter: [@SongZi](https://x.com/Songzi39590361)

[![Star History Chart](https://api.star-history.com/svg?repos=coolzilj/ComfyUI-Photopea&type=Date)](https://star-history.com/#coolzilj/ComfyUI-Photopea&Date)
