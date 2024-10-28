Similar to how we are can we use the localStorage.setItem(id, element.value); to write data to the table? 

the table is initiated like this:
<tbody>
                            <tr>
                                <td><input type="text" class="geometry-name" placeholder="Enter name" /></td>
                                <td><input type="number" class="geometry-thickness" placeholder="Enter thickness" /></td>
                                <td><button class="add-geo">Add Geo</button></td>
                            </tr>
                        </tbody>

and it has two button that can add or remove rows. 

const urlParams = new URLSearchParams(window.location.search);
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