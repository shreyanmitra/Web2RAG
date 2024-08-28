# Create a virtual environment
python3 -m venv env

# Activate the virtual environment
source env/bin/activate

# Upgrade pip in the virtual environment
pip install --upgrade pip

# Install required dependencies
pip3 install lancedb langchain langchain_community prettytable sentence-transformers huggingface-hub bs4 pypdf pandas

# This is optional, I did it for removing a warning
pip3 uninstall urllib3
pip3 install 'urllib3<2.0'
