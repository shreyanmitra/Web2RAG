from setuptools import setup, find_namespace_packages

setup(name='WebAssistant',
      version='0.0.3',
      description='WebAssistant: Quickly Deploy an AI Assistant Chatbot for your Personal Webpage',
      long_description=open("README.md", "r", encoding="utf-8").read(),
      long_description_content_type="text/markdown",
      keywords="ai chatbot website-builder gpt-4",
      url="https://github.com/shreyanmitra/WebAssistant",
      author = "Shreyan Mitra",
      install_requires=[
        "gradio",
        "langchain_chroma",
        "langchain_community",
        "langchain_core",
        "langchain_text_splitters",
        "langchainhub",
        "pandas",
        "xmltodict",
        "urllib3",
        "certifi",
        "warnings"
      ],
      include_package_data=True,
      package_data={'': ['static/*']},
      packages=["WebAssistant"],
      )
