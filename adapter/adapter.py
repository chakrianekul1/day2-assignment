import json
import xmltodict
from abc import ABC, abstractmethod

# 1. The Interface (The "Blueprint")
# This ensures every new format we add has a 'to_json' and 'from_json' method.
class DataConverter(ABC):
    @abstractmethod
    def to_json(self, data):
        pass

    @abstractmethod
    def from_json(self, json_str):
        pass

# 2. The XML Adapter (Specific Implementation)
class XMLAdapter(DataConverter):
    def to_json(self, xml_str):
        # Converts XML string to a Python Dictionary, then to JSON
        data_dict = xmltodict.parse(xml_str)
        return json.dumps(data_dict, indent=4)

    def from_json(self, json_str):
        # Converts JSON back to XML (if needed)
        data_dict = json.loads(json_str)
        return xmltodict.unparse(data_dict, pretty=True)
    

# To add a new format, you just add one class. 
# You don't change the UniversalConverter at all!
class DictAdapter(DataConverter):
    def to_json(self, data_dict):
        return json.dumps(data_dict)

    def from_json(self, json_str):
        return json.loads(json_str)

# Now you can use the same Manager for a Dictionary!


# 3. The "Context" or Client Code
# This is the "Universal Converter" you asked for. 
class UniversalConverter:
    def __init__(self, strategy: DataConverter):
        self._strategy = strategy

    def convert_to_json(self, data):
        return self._strategy.to_json(data)

# --- HOW IT WORKS IN PRACTICE ---

xml_data = """<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
    <book category="fantasy">
        <title lang="en">A Song of Ice and Fire</title>
        <author>George R. R. Martin</author>
    </book>
</bookstore>"""

# We plug in the XMLAdapter
converter = UniversalConverter(XMLAdapter())
result_json = converter.convert_to_json(xml_data)

print("Converted JSON:")
print(result_json)


dict_data = {"bookstore": {"bookname": "A Song of Ice and Fire"}}
new_converter = UniversalConverter(DictAdapter())
print(new_converter.convert_to_json(dict_data))