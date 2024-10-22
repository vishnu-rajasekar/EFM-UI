import System
import Rhino
import Grasshopper
import Eto.Forms as forms
import Eto.Drawing as drawing
import scriptcontext as sc
import json

class Element:
    def __init__(self, name, geometries, thickness):
        self.name = name
        self.geometries = geometries
        self.thickness = thickness

class MyComponent(Grasshopper.Kernel.GH_ScriptInstance):
    
    slider_values = {}

    def RunScript(self, get_inputs, path):
        # Define a standalone function to recompute Grasshopper solution
        def schedule_recompute():
            # Get the current Grasshopper document
            gh_doc = Grasshopper.Instances.ActiveCanvas.Document
            if gh_doc is not None:
                # Schedule a solution to recompute the Python component
                gh_doc.ScheduleSolution(1, lambda doc: ghenv.Component.ExpireSolution(False))

        # Define a function to select geometries from Rhino
        def get_surfaces():
            # Allow the user to select multiple surfaces
            go = Rhino.Input.Custom.GetObject()
            go.SetCommandPrompt("Select surfaces")
            go.GeometryFilter = Rhino.DocObjects.ObjectType.Surface
            go.EnablePreSelect(False, True)
            go.EnablePostSelect(True)
            go.GetMultiple(1, 0)  # Require at least one surface

            if go.CommandResult() != Rhino.Commands.Result.Success:
                return None

            # Collect selected surfaces
            surfaces = []
            for obj_ref in go.Objects():
                surface = obj_ref.Surface()
                if surface:
                    surfaces.append(surface)

            return surfaces

        # Define the WebView dialog class
        class WebviewSliderDialog(forms.Form):
            def __init__(self):
                super(WebviewSliderDialog, self).__init__()
                # Set up the WebView to load the HTML file
                self.Title = "Slider WebView"
                self.Padding = drawing.Padding(5)
                self.ClientSize = drawing.Size(400, 800)
                self.Resizable = True
                self.Topmost = True  # Keep the form on top

                # Create the WebView control and load the local HTML file
                self.m_webview = forms.WebView()
                self.m_webview.Size = drawing.Size(400, 800)

                

                self.m_webview.Url = System.Uri(path)  # Update with actual path

                # Subscribe to the DocumentLoading event to intercept navigation
                self.m_webview.DocumentLoading += self.on_document_loading

                # Layout
                layout = forms.StackLayout()
                layout.Items.Add(forms.StackLayoutItem(self.m_webview, True))
                self.Content = layout
                self.set_center()

            # Get the Rhino main window handle and set the form to appear at the center of the screen
            def set_center(self):
                main_window = Rhino.UI.RhinoEtoApp.MainWindow
                screen_rect = main_window.Bounds
                self.Location = drawing.Point((screen_rect.Width - self.ClientSize.Width) // 2 + screen_rect.X,
                                              (screen_rect.Height - self.ClientSize.Height) // 2 + screen_rect.Y)

            def on_document_loading(self, sender, e):

                # Intercept custom scheme (e.g., "savetable")
                if e.Uri.Scheme == "savetable":
                    e.Cancel = True  # Prevent actual navigation
                    table_state_json = e.Uri.Query.strip('?')
                    sc.sticky["table_state"] = table_state_json
                    update_elements_from_table_state(table_state_json)

                if e.Uri.Scheme == "loadtable":
                    e.Cancel = True  # Prevent actual navigation
                    if "table_state" in sc.sticky:
                        state_string = sc.sticky["table_state"]
                        sender.Url = System.Uri(f"javascript:loadTableStateFromSticky('{state_string}')")

                if e.Uri.Scheme == "sliderupdate":
                    e.Cancel = True  # Prevent actual navigation
                    value = e.Uri.Query.strip('?')  # Get the value from the query string
                    slider_id, slider_value = value.split('=')
                    sc.sticky[slider_id] = float(slider_value)
                    schedule_recompute()

                if e.Uri.Scheme == "geometryupdate":
                    e.Cancel = True  # Prevent actual navigation
                    value = e.Uri.Query.strip('?')
                    name, thickness = value.split(',')
                    thickness = float(thickness)
                    surfaces = get_surfaces()
                    if surfaces:
                        element = Element(name, surfaces, thickness)
                        add_or_update_element(element)
                        schedule_recompute()
                        self.BringToFront()  # Bring the form back to the foreground

        # Function to update elements list from table state
        def update_elements_from_table_state(table_state_json):
            table_state = json.loads(table_state_json)
            elements = sc.sticky.get("elements", [])

            for i, row_data in enumerate(table_state):
                name = row_data.get("name")
                thickness = float(row_data.get("thickness", 0))

                if len(elements) > i:
                    # Update existing element
                    elements[i].name = name
                    elements[i].thickness = thickness
                else:
                    # Add new element with empty geometries
                    new_element = Element(name, [], thickness)
                    elements.append(new_element)

            sc.sticky["elements"] = elements

        # Function to add or update an element in the elements list
        def add_or_update_element(element):
            elements = sc.sticky.get("elements", [])

            # Check if an element with the same name already exists, and update it
            for i, existing_element in enumerate(elements):
                if existing_element.name == element.name:
                    elements[i] = element
                    sc.sticky["elements"] = elements
                    return

            # Otherwise, add the new element
            elements.append(element)
            sc.sticky["elements"] = elements

        # Run the UI within Rhino/Grasshopper based on a boolean variable
        if get_inputs:
            if 'form' not in sc.sticky or not isinstance(sc.sticky['form'], WebviewSliderDialog) or not sc.sticky['form'].Visible:
                
                

                form = WebviewSliderDialog()
                sc.sticky['form'] = form
                sc.sticky['form'].Show()
            
            

        # Ensure output 'a' is updated after running the UI
        #value = sc.sticky.get('slider_value', None)
        
        #value = slider_values["slider1"]
        slider1_value = sc.sticky.get('slider1', None)

        elements = sc.sticky.get('elements', [])
        element_names = [element.name for element in elements]
        element_geo = []
        for element in elements:
            for geo in element.geometries:
                element_geo.append(geo)

        element_thik = [element.thickness for element in elements]
        

        return slider1_value, element_names, element_geo, element_thik
