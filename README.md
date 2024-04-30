# Accessibility Toolbar.
A free to use accessibility toolbar.

# Table of contents
• Introduction<br>
• Installation<br>
• Usage<br>
• More

# Introduction
This project demonstrates foundation for an acessibility toolbar extension for Google Chrome. All features available and how they are used are described in the Usage section.

# Installation
The extension can be loaded into Chrome through the packed extension or unpacked extension. Steps are listed below for both. Steps for back-end set up are listed below. The back-end currently runs on Python 3.12.

## Packed Extension
• By navigating to `chrome://extensions` on your browser, you can drop the `chrome-extension.crx` file onto the UI to install the extension. This should add the extension `Accessibility Toolbar 1.0` to your browser.<br>

## Unpacked Extension
• By navigating to `chrome://extensions` on your browser and enabling `Developer mode` (top right), you can click on `Load unpacked` at the top left corner of the screen, you can load the extension into Chrome by selecting the `/chrome-extension` directory and clicking select folder. This should add the extension `Accessibility Toolbar 1.0` to your browser.<br>

## Back-end set-up
• To enable the back-end for translation/dictionary use, you must first install the necessary packages through the `/requirements.txt` file using Python with the command `pip install -r requirements.txt` in your terminal. From there, you can simply run the command `python manage.py runserver` and the page translation/dictionary features shall become functional. This can also be done through `#setup.bat` for first time use, and the server may be run with `#run.bat` from then on. If you are a Linux user you MUST run `sudo apt-get update && apt-get install ffmpeg libsm6 libxext6 -y` for all the required packages to work.

# Usage
The toolbar will display at the bottom of every web page in a fixed position, all current functionality is listed below.

## Play
The purple button with the alt-text `Play` can be pressed to enable Text-To-Speech (TTS) functionality across the webpage. Clicking on `Start TTS` will allow you to read text as you select it, dynamically updating as you select text, while `Read Selected` reads out what you currently have selected on the page. This works across languages.

## Text Modification
The blue button with the alt-text `Text` can be pressed to enable text modification across the webpage. This feature modifies Font Face, Font Colour (both of which can be reset), Font Size, Line Height and Character Spacing.<br>

Font Size and Line Height are scaled by a factor of 10% in either direction, whereas Character Spacing is modified by 0.2px in either direction.

## Theme Modification
The green button with the alt-text `Theme` can be pressed to enable theme modification across the webpage. This feature modifies the overall theme (colour) of a webpage by applying a colour filter based on HSL levels.<br>

`Theme Default` will reset the page its default colours, whereas all other buttons will change the look of the page. `Theme Black` will also change the font colour of the page to white to accommodate the new background.<br>

## Dictionary
The pink button with the alt-text `Dictionary` can be pressed to look up a word and its definition, pronunciation, synonyms, antonyms and examples from its wiktionary entry. This can be done either with the search bar or through the current selected word with the `Search Word` and `Search Selected` buttons. This requires the back-end to be activated for use.

## Translate
The red button with the alt-text `Translate` can be pressed to translate an entire webpage. This feature gathers all text nodes on the page and sends them to the back-end in order to translate the text and is then returned to the front-end. The `Default Language` button can be pressed to reset the page language.<br>

## Magnifying Glass
The cyan button with the alt-text `Magnify` can be pressed to enable a magnifying glass. Options `zoom` and `size` are provided to modify the zoom multiplier and the affected page area respectively. On clicking `Show Magnifier`, a magnifying glass will display that follows your mouse, akin to a real magnifying glass.

## Image Classification
If enabled in the settings (it will be by default), whenever hovering over an image, a button reading `Generate alt-text` will appear. Upon clicking this button, the selected image will be classified and you will receive image classifications along with their corresponding confidence values.

## Manual
The grey button with the alt-text `Manual` will bring you to the page you are reading right now.

## Settings
The grey button with the alt-text `Settings` will bring you to the settings page. From here, you can enable and disable both the toolbar and the image classifier. In order to see these changes applied, you must refresh the current web page.

## Hide Toolbar
The grey button with the alt-text `Hide` can be pressed to hide the toolbar. This will collapse the overall toolbar, closing all open menus and replacig the toolbar with a button in the middle of the page with the alt-text `Show Toolbar`, used to re-open the toolbar.