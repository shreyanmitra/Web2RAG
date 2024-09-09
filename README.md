# WebAssistant

Easily deploy an AI assistant chatbot for your personal website.

This repository contains a Python library and the template for a React app, both of which use state-of-the-art Retrieval Augmented Generation (RAG) prompting methodologies.

## Prerequisites
1. Make sure you have an OpenAI API key
2. Have the base URL of the website for which you want to create the chatbot
3. Have your CloudFlare account (if using the React functionality)

## Using the Python Library

To use the python library, first install with

```bash
pip install WebAssistant
```

Then, write

```python
from WebAssistant import *
myChatbot = Hub()
myChatbot.launch(YOUR_OPENAI_API_KEY, YOUR_WEBSITE)
```

This will create a link to a chatbot built with Gradio that can answer questions about your website.

If you're looking for a very basic (and not recommended) solution, simply iframe the link on your webpage. Note that the link will expire every 3 days and will need to be regenerated using ``launch()``

## Using the React App
For a more complicated and technically involved solution, run the following Python code:

```python
from WebAssistant import *
myChatbot = Hub()
myChatbot.deployReactApp(YOUR_OPENAI_API_KEY, YOUR_WEBSITE, YOUR_CLOUDFLARE_API_KEY)
```

This will give you a permanent link that you can embed in your html webpage through a ``<script>`` tag. The look is much better than the Gradio app, as well.

Note that you must NOT remove the credits to this repository included at the bottom of the chatbot UI.
## Questions?
Feel free to send any questions you have through the issues tab on Github.
