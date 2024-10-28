document.addEventListener('DOMContentLoaded', function () {
    console.log("Page Loaded"); // To confirm when the document is loaded
    const geometryContent = document.getElementById('geometry-content');
    const materialContent = document.getElementById('material-content');
    const loadContent = document.getElementById('load-content');
    const geotechnicContent = document.getElementById('geotechnic-content');
    const historyStack = []; // Stack to store history of table states for undo functionality

    class Element {
        constructor(name, geometries, thickness) {
            this.name = name;
            this.geometries = geometries;
            this.thickness = thickness;
        }
    }

    // Initialize elementsList with data from localStorage
    let elementsList = getElementsFromLocalStorage();

    // Listen for the 'elementsLoaded' event dispatched from Python
    window.addEventListener('elementsLoaded', function () {
        console.log("'elementsLoaded' event received");
        // Re-initialize elementsList from localStorage
        elementsList = getElementsFromLocalStorage();
        console.log("elementsList loaded from localStorage:", elementsList);
        // Rebuild the table
        writeTableRow();
    });
  
    ///////////////////////////////////////////////////////////////////////////////////////////
    // SLIDER 
    ///////////////////////////////////////////////////////////////////////////////////////////

    // Get URL parameters for initial slider values
    const sliderIds = ["slider1", "slider255"];
       
    sliderIds.forEach(function (id) {
        const element = document.getElementById(id);
        if (element) {
            // Retrieve stored value or set to default if not found
            let storedValue = localStorage.getItem(id);
            if (storedValue === null) {
                storedValue = 50;  // Default value
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


    ///////////////////////////////////////////////////////////////////////////////////////////
    // Attach button events to add and remove rows
    ///////////////////////////////////////////////////////////////////////////////////////////

    document.getElementById('button-1').addEventListener('click', function () {
        addTableRow();
    });

    document.getElementById('button-3').addEventListener('click', function () {
        const activeRow = document.querySelector('.active-row');
        if (activeRow) {
            // Find the index of the row being removed
            const elementIndex = activeRow.dataset.elementIndex;
            const element = elementsList[elementIndex]; // Get the element before removing
            elementsList.splice(elementIndex, 1); // Remove the element from the elementsList array
    
            activeRow.remove();
            updateElementIndices(); // Update indices after removal
            saveElementsToLocalStorage(); // Update local storage after removal
    
            // Notify Python of the deletion
            window.location.href = `deleteelement:delete?name=${encodeURIComponent(element.name)}`;
        } else {
            alert("Please select a row to remove.");
        }
    });

    ///////////////////////////////////////////////////////////////////////////////////////////
    // WRITE TABLE
    ///////////////////////////////////////////////////////////////////////////////////////////

    function writeTableRow() {
        const tableBody = document.querySelector('#geometry-table tbody');
        tableBody.innerHTML = ""; // Clear existing rows before writing new ones

        if (elementsList && elementsList.length > 0) {
            elementsList.forEach((element, index) => {
                addTableRow(element.name, element.thickness, index);
            });
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////////////
    // TABLE 
    ///////////////////////////////////////////////////////////////////////////////////////////

    // Modified addTableRow function to use the new save function
    function addTableRow(name = "", thickness = "", elementIndex = null) {
        const tableBody = document.querySelector('#geometry-table tbody');
        const newRow = tableBody.insertRow();

        let nameCell = newRow.insertCell(0);
        let thicknessCell = newRow.insertCell(1);
        let buttonCell = newRow.insertCell(2);

        nameCell.innerHTML = `<input type="text" value="${name}" class="geometry-name" placeholder="Enter name" />`;
        thicknessCell.innerHTML = `<input type="number" value="${thickness}" class="geometry-thickness" placeholder="Enter thickness" />`;
        buttonCell.innerHTML = `<button class="add-geo">Add Geo</button>`;

        let element;

        if (elementIndex !== null && elementsList[elementIndex]) {
            // Use existing element
            element = elementsList[elementIndex];
        } else {
            // Create new element
            element = new Element(name, [], thickness);
            elementsList.push(element);
            elementIndex = elementsList.length - 1;
        }

        // Store element index in row's data attribute
        newRow.dataset.elementIndex = elementIndex;

        // Add event listeners to input fields to update element
        const nameInput = nameCell.querySelector('.geometry-name');
        const thicknessInput = thicknessCell.querySelector('.geometry-thickness');

        nameInput.addEventListener('change', function () {
            const updatedName = nameInput.value;
            element.name = updatedName;
            saveElementsToLocalStorage();
        });

        thicknessInput.addEventListener('change', function () {
            const updatedThickness = thicknessInput.value;
            element.thickness = updatedThickness;
            saveElementsToLocalStorage();
        });

        // Add click event for the Add Geo button
        buttonCell.querySelector('.add-geo').addEventListener('click', function () {
            const geometryName = element.name;
            const geometryThickness = element.thickness;

            if (geometryName && !isNaN(geometryThickness)) {
                console.log('Element Selected for Geo:', element);

                // Save the updated elements list to local storage
                saveElementsToLocalStorage();

                // Notify Python of the new geometry (if required)
                window.location.href = `geometryupdate:geo?${encodeURIComponent(geometryName)},${geometryThickness}`;
            } else {
                alert("Please fill all fields to create an element.");
            }
        });

        attachRowClickEvents();
        saveElementsToLocalStorage(); // Save state after adding a new row
        // No need to notify Python
    }

    function attachRowClickEvents() {
        document.querySelectorAll('#geometry-table tbody tr').forEach(row => {
            row.addEventListener('click', function () {
                document.querySelectorAll('#geometry-table tbody tr').forEach(r => r.classList.remove('active-row'));
                row.classList.add('active-row');
            });
        });
    }

    ///////////////////////////////////////////////////////////////////////////////////////////
    // LOCAL STORAGE HANDLING
    ///////////////////////////////////////////////////////////////////////////////////////////

    function saveElementsToLocalStorage() {
        localStorage.setItem('elementsList', JSON.stringify(elementsList));
    }

    // Modify getElementsFromLocalStorage function
    function getElementsFromLocalStorage() {
        const storedElements = localStorage.getItem('elementsList');
        if (storedElements) {
            try {
                const elementsArray = JSON.parse(storedElements);
                // Convert plain objects to Element instances
                const elementsInstances = elementsArray.map(elementData => {
                    return new Element(elementData.name, elementData.geometries, elementData.thickness);
                });
                console.log("Elements loaded from localStorage:", elementsInstances);
                return elementsInstances;
            } catch (e) {
                console.error("Error parsing elements from localStorage:", e);
                return [];
            }
        } else {
            console.log("No elements in localStorage");
            return [];
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////////////
    // UNDO ACTIONS HANDLING
    ///////////////////////////////////////////////////////////////////////////////////////////

    function updateElementIndices() {
        // Update element indices stored in row data attributes after any changes
        document.querySelectorAll('#geometry-table tbody tr').forEach((row, index) => {
            row.dataset.elementIndex = index;
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

    // Attach event listener for Ctrl + Z to undo the last action
    document.addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.key === 'z') {
            event.preventDefault();
            undoLastAction();
        }
    });

    // Attach the initial events
    attachTabEventListeners();
    // Write table rows from local storage when the page is loaded
    writeTableRow();

    // attachSliderEvent();
    // attachRowClickEvents();
    // attachAddGeoEvent(); // Attach initial event to existing buttons

    // Load the table state when the page is loaded
    // loadTableStateFromSession();
});