import sys
sys.path.append('./DewFunctions/UI/')
from NLP.nlp import nlpHandler

class NLPService(object):
    def HandleNLPString(self, text):
      handler = nlpHandler()
      extracted_data = handler.extractActorsAndBehaviors(text)
      print(extracted_data)
      return extracted_data
