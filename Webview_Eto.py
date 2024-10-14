import System
import Rhino
import Grasshopper
import Eto.Forms as forms
import Eto.Drawing as drawing
import scriptcontext as sc

class MyComponent(Grasshopper.Kernel.GH_ScriptInstance):
    def RunScript(self, get_inputs, path):
        # Define a standalone function to recompute Grasshopper solution
        def schedule_recompute():
                # Get the current Grasshopper document
                gh_doc = Grasshopper.Instances.ActiveCanvas.Document
                if gh_doc is not None:
                    # Schedule a solution to recompute the Python component
                    gh_doc.ScheduleSolution(1, lambda doc: ghenv.Component.ExpireSolution(False))
        # Define the WebView dialog class
        class WebviewSliderDialog(forms.Form):
            def __init__(self):
                super(WebviewSliderDialog, self).__init__()
                # Set up the WebView to load the HTML file
                self.Title = "Slider WebView"
                self.Padding = drawing.Padding(5)
                self.ClientSize = drawing.Size(400, 800)
                self.Resizable = True

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
                print (screen_rect.X)
                self.Location = drawing.Point((screen_rect.Width - self.ClientSize.Width) // 2 + screen_rect.X,
                                              (screen_rect.Height - self.ClientSize.Height) // 2 + screen_rect.Y)

            def on_document_loading(self, sender, e):
                # Intercept custom scheme (e.g., "greenscenario")
                if e.Uri.Scheme == "greenscenario":
                    e.Cancel = True  # Prevent actual navigation
                    value = e.Uri.Query.strip('?')  # Get the value from the query string
                    self.communicate_with_webview(value)   
   

            def communicate_with_webview(self, value):
                # Log the slider value to the Rhino command line or output panel
                sc.sticky["slider_value"] = float(value)
                schedule_recompute()

            

        # Run the UI within Rhino/Grasshopper based on a boolean variable
        if get_inputs:
            
            if 'form' not in sc.sticky or not isinstance(sc.sticky['form'], WebviewSliderDialog) or not sc.sticky['form'].Visible:
                form = WebviewSliderDialog()
                sc.sticky['form'] = form
                sc.sticky['form'].Show()
                

        # Ensure output 'a' is updated after running the UI

        value = sc.sticky.get('slider_value', None)
        return value