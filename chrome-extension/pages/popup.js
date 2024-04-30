// settings persistence stuff i suppose
document.addEventListener('DOMContentLoaded', function() {
    var useClassifierCheckbox = document.getElementById('useClassifier');
    var displayToolbarCheckbox = document.getElementById('displayToolbar');

    // load the checkbox state from storage when the page loads
    chrome.storage.sync.get(['useClassifier', 'displayToolbar'], function(result) {
        // if the state is not found in storage, default to true
        useClassifierCheckbox.checked = result.useClassifier !== undefined ? result.useClassifier : true;
        displayToolbarCheckbox.checked = result.displayToolbar !== undefined ? result.displayToolbar : true;
    });

    // save the checkbox state to storage when the checkbox state changes
    useClassifierCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({useClassifier: useClassifierCheckbox.checked});
    });

    displayToolbarCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({displayToolbar: displayToolbarCheckbox.checked});
    });
});