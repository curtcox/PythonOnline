# /// script
# dependencies = ["gradio==6.9.0", "httpcore==1.0.9", "starlette==0.50.0"]
# ///
import os
os.environ["GRADIO_ANALYTICS_ENABLED"] = "False"
import gradio as gr

# Run a real Gradio Interface's input/function/output pipeline locally.
# Change the names in Program input, then run again.
# Full interactive widgets use Gradio Lite: https://www.gradio.app/playground
async def greet(name):
    return f"Hello, {name.strip() or 'Python learner'}!"

demo = gr.Interface(
    fn=greet,
    inputs=gr.Textbox(label="Name"),
    outputs=gr.Textbox(label="Greeting"),
    # The simple logger avoids multiprocessing, unavailable in browsers.
    flagging_callback=gr.SimpleCSVLogger(),
    flagging_mode="never",
    analytics_enabled=False,
)

print("Gradio: a greeting interface")
for _ in range(2):
    name = input("Name: ")
    result = await demo.process_api(0, [name])
    print(result["data"][0])
# No launch(): Python Online shows the results without a web server.
