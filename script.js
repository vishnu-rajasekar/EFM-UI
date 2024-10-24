document.addEventListener('DOMContentLoaded', function () {
    console.log("Page Loaded"); // To confirm when the document is loaded
    const content = document.getElementById('content');
    const geometryContent = document.getElementById('geometry-content');
    const materialContent = document.getElementById('material-content');
    const loadContent = document.getElementById('load-content');
    const geotechnicContent = document.getElementById('geotechnic-content');
    const historyStack = []; // Stack to store history of table states for undo functionality

    ///////////////////////////////////////////////////////////////////////////////////////////
    // SLIDER 
    ///////////////////////////////////////////////////////////////////////////////////////////

    // Get URL parameters for initial slider values
    // const urlParams = new URLSearchParams(window.location.search);
    const sliderIds = ["slider1", "slider255"];

    // // Initialize sliders with default values or from URL params
    // sliderIds.forEach(function (id) {
    //     const element = document.getElementById(id);
    //     if (element) {
    //         // Get initial value from URL parameters or default to 75
    //         const initialValue = urlParams.get(id) || 2;
    //         element.value = initialValue;
    //         console.log(`Setting initial value for ${id}: ${initialValue}`);
    //     } else {
    //         console.error(`Slider with ID ${id} not found.`);
    //     }
    // });

    // // Add event listeners for slider value changes
    // sliderIds.forEach(function (id) {
    //     const element = document.getElementById(id);
    //     if (element) {
    //         element.addEventListener('input', function () {
    //             // When the slider changes, update the value in Rhino via the custom URI scheme
    //             window.location.href = `sliderupdate:slider?${id}=${element.value}`;
    //         });
    //     }
    // });

    
    sliderIds.forEach(function (id) {
        const element = document.getElementById(id);
        if (element) {
            // Retrieve stored value or set to default if not found
            let storedValue = localStorage.getItem(id);
            if (storedValue === null) {
                storedValue = 95;  // Default value
                localStorage.setItem(id, storedValue);  // Set the default value to localStorage
                console.log(`Setting initial value for ${id} to default: ${storedValue}`);
            } else {
                console.log(`Setting ${id} to stored value: ${storedValue}`);
            }

            element.value = storedValue;  // Set the slider to the retrieved/stored value
        } else {
            console.error(`Slider with ID ${id} not found.`);
        }
    });

    // Add event listeners to store values when they change
    sliderIds.forEach(function (id) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', function () {
                console.log(`Updating ${id} to value: ${element.value}`);
                localStorage.setItem(id, element.value);
                window.location.href = `sliderupdate:slider?${id}=${element.value}`;
            });
        }
    });
    
    
    ///////////////////////////////////////////////////////////////////////////////////////////
    // TAB 
    ///////////////////////////////////////////////////////////////////////////////////////////
    const tabs = {
        geometry: document.getElementById('geometry-tab'),
        material: document.getElementById('material-tab'),
        load: document.getElementById('load-tab'),
        geotechnic: document.getElementById('geotechnic-tab')
    };

    function setActiveTab(activeTab) {
        Object.values(tabs).forEach(tab => tab.classList.remove('active'));
        activeTab.classList.add('active');
    }

    function hideAllContent() {
        geometryContent.style.display = 'none';
        materialContent.style.display = 'none';
        loadContent.style.display = 'none';
        geotechnicContent.style.display = 'none';
    }

    // Function to attach tab click event listeners
    function attachTabEventListeners() {
        tabs.geometry.addEventListener('click', function () {
            setActiveTab(tabs.geometry);
            hideAllContent();
            geometryContent.style.display = 'block';
            window.location.href = "loadtable:state"; // Request Python to provide table state
        });

        tabs.material.addEventListener('click', function () {
            setActiveTab(tabs.material);
            hideAllContent();
            materialContent.style.display = 'block';
        });

        tabs.load.addEventListener('click', function () {
            setActiveTab(tabs.load);
            hideAllContent();
            loadContent.style.display = 'block';
            // attachSliderEvent(); // Attach slider event after changing content
        });

        tabs.geotechnic.addEventListener('click', function () {
            setActiveTab(tabs.geotechnic);
            hideAllContent();
            geotechnicContent.style.display = 'block';
        });
    }

    // Attach button events to add and remove rows
    document.getElementById('button-1').addEventListener('click', function () {
        addTableRow();
    });

    document.getElementById('button-3').addEventListener('click', function () {
        const activeRow = document.querySelector('.active-row');
        if (activeRow) {
            activeRow.remove();
            saveTableStateToHistory();
            saveTableStateToSticky();
        } else {
            alert("Please select a row to remove.");
        }
    });


    ///////////////////////////////////////////////////////////////////////////////////////////
    // TABLE HISTORY
    ///////////////////////////////////////////////////////////////////////////////////////////
    
    // function saveTableStateToHistory() {
    //     const rows = Array.from(document.querySelectorAll('#geometry-table tbody tr'));
    //     const tableState = rows.map(row => {
    //         const nameInput = row.querySelector('.geometry-name').value;
    //         const thicknessInput = row.querySelector('.geometry-thickness').value;
    //         return { name: nameInput, thickness: thicknessInput };
    //     });
    //     historyStack.push(JSON.stringify(tableState));
    // }

    // function saveTableStateToSticky() {
    //     const rows = Array.from(document.querySelectorAll('#geometry-table tbody tr'));
    //     const tableState = rows.map(row => {
    //         const nameInput = row.querySelector('.geometry-name').value;
    //         const thicknessInput = row.querySelector('.geometry-thickness').value;
    //         return { name: nameInput, thickness: thicknessInput };
    //     });
    //     window.location.href = `savetable:state?${JSON.stringify(tableState)}`;
    // }

    // function loadTableStateFromSticky(stateString) {
    //     const tableState = JSON.parse(stateString);
    //     const tableBody = document.querySelector('#geometry-table tbody');
    //     tableBody.innerHTML = ""; // Clear existing rows
    //     tableState.forEach(rowData => {
    //         addTableRow(rowData.name, rowData.thickness);
    //     });
    // }

    ///////////////////////////////////////////////////////////////////////////////////////////
    // TABLE HISTORY
    ///////////////////////////////////////////////////////////////////////////////////////////
    function addTableRow(name = "", thickness = "") {
        const tableBody = document.querySelector('#geometry-table tbody');
        const newRow = tableBody.insertRow();
        let nameCell = newRow.insertCell(0);
        let thicknessCell = newRow.insertCell(1);
        let buttonCell = newRow.insertCell(2);

        nameCell.innerHTML = `<input type="text" value="${name}" class="geometry-name" placeholder="Enter name" />`;
        thicknessCell.innerHTML = `<input type="number" value="${thickness}" class="geometry-thickness" placeholder="Enter thickness" />`;
        buttonCell.innerHTML = `<button class="add-geo">Add Geo</button>`;

        buttonCell.querySelector('.add-geo').addEventListener('click', function () {
            const updatedName = newRow.querySelector('.geometry-name').value;
            const updatedThickness = newRow.querySelector('.geometry-thickness').value;
            if (updatedName && !isNaN(updatedThickness)) {
                window.location.href = `geometryupdate:geo?${updatedName},${updatedThickness}`;
            } else {
                alert("Please fill all fields to create an element.");
            }
            saveTableStateToSticky(); // Save state to sticky after clicking Add Geo
        });

        attachRowClickEvents();
        attachAddGeoEvent(); // Ensure new row buttons have event listeners attached
        saveTableStateToHistory();
        saveTableStateToSticky();
    }

    function attachAddGeoEvent() {
        document.querySelectorAll('.add-geo').forEach(button => {
            button.addEventListener('click', function () {
                const geometryName = button.closest('tr').querySelector('.geometry-name').value;
                const geometryThickness = parseFloat(button.closest('tr').querySelector('.geometry-thickness').value);

                if (geometryName && !isNaN(geometryThickness)) {
                    window.location.href = `geometryupdate:geo?${geometryName},${geometryThickness}`;
                } else {
                    alert("Please fill all fields to create an element.");
                }
            });
        });
    }

    function undoLastAction() {
        if (historyStack.length > 0) {
            const lastState = historyStack.pop();
            loadTableStateFromSticky(lastState);
        } else {
            alert("No actions to undo.");
        }
    }

    function attachRowClickEvents() {
        document.querySelectorAll('#geometry-table tbody tr').forEach(row => {
            row.addEventListener('click', function () {
                document.querySelectorAll('#geometry-table tbody tr').forEach(r => r.classList.remove('active-row'));
                row.classList.add('active-row');
            });
        });
    }

    // Attach event listener for Ctrl + Z to undo the last action
    document.addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.key === 'z') {
            event.preventDefault();
            undoLastAction();
        }
    });

    // Attach the initial events
    attachTabEventListeners();
    // attachSliderEvent();
    attachRowClickEvents();
    attachAddGeoEvent(); // Attach initial event to existing buttons
});