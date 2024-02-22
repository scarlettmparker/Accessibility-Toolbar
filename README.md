# Accessibility Toolbar Prototype.
A simple prototype for an accessibility toolbar.

# Table of contents
• Introduction<br>
• Installation<br>
• Usage<br>
• More

# Introduction
This project demonstrates a minimally functional (few features) prototype for an acessibility toolbar extension for Google Chrome. Currently, the only available features are page translation, text modification and theme changing - with minimal UI.

# Installation
Currently, there's no set installation to easily add this to Chrome as the extension is unpackaged and the back-end must be run manually, but some steps are provided below.

• By navigating to `chrome://extensions` on your browser and clicking `Load unpacked` at the top left corner of the screen, you can load the extension into Chrome by selecting the `/chrome-extension` directory and clicking select folder. This should add the extension `Accessibility Toolbar 1.0` to your browser.<br>

• To enable the back-end for translation use, you must first install the necessary packages through `/requirements.txt` file using Python with the command `pip install -r requirements.txt` in your terminal. From there, you can simply run the command `python manage.py runserver` and page translation shall become functional. It should be noted that the Google Translate API has a daily limit of 250,000 characters.

# Usage
The toolbar will display at the bottom of every web page in a fixed position, all current functionality is listed below.

## Text Modification
The blue button with the alt-text `Text` can be pressed to enable text modification across the webpage. This feature modifies Font Face, Font Colour (both of which can be reset), Font Size, Line Height and Character Spacing.<br>

Font Size and Line Height are scaled by a factor of 10% in either direction, whereas Character Spacing is modified by 0.2px in either direction.

## Theme Modification
The green button with the alt-text `Theme` can be pressed to enable theme modification across the webpage. This feature modifies the overall theme (colour) of a webpage by applying a colour filter based on HSL levels.<br>

`Theme Default` will reset the page its default colours, whereas all other buttons will change the look of the page. `Theme Black` will also change the font colour of the page to white to accommodate the new background.<br>

This feature will be expanded to further themes in the future. The `Custom Colour` button is currently non-functional.

## Translate
The red button with the alt-text `Translate` can be pressed to translate an entire webpage. This feature gathers all text nodes on the page and sends them to the back-end in order to translate the text and is then returned to the front-end. The `Default Language` button can be pressed to reset the page language.<br>

Due to the nature of the Google Translate API, a maximum of only 5000 characters can be translated at once, resulting in page translation not being 100% optimal.

## Hide Toolbar
The grey button with the alt-text `Hide` can be pressed to hide the toolbar. This will collapse the overall toolbar, closing all open menus and replacig the toolbar with a button in the middle of the page with the alt-text `Show Toolbar`, used to re-open the toolbar.

# More
Licensing, Credits, Troubleshooting to be added.