import yaml
import collections
import sys, os, uuid

class GeneralParseMagi(object):

    # def __init__(self):
    #     self.yaml_loader = yaml_loader
    #     self.yaml_dump = yaml_dump

    

    # # filepath=os.path.join(os.path.dirname(os.path.abspath(__file__)), "simple_aal_import.aal")
    # # print(filepath)
    # # data=yaml_loader(filepath)
    # # print(data)

    # filepath=os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp.aal")
    # yaml_dump(filepath, )
    # filepath=os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp.aal")
    # data=yaml_loader(filepath)
    # print(data)

    def parse(data):

        def yaml_loader(filepath):
            """Loads a yaml file"""
            with open(filepath,"r") as file_descriptor:
                data = yaml.load(file_descriptor)
            return data

        def yaml_dump(filepath,data):
            """Dumps data to a yaml file"""
            with open (filepath, "w") as file_descriptor:
                yaml.dump(data, file_descriptor)
                
        data = yaml.load(data)
        res_data = {}
        bindKey = ""
        triggerList = []
        scenarioData = []
        for key,val in data.items():
            if "stream" in key:
                scenarioData = data[key]
            if(type(val)==type(dict())):
                for k,v in val.items():
                    print (key + "=>" + str(k) + "," + str(v))
                    if "agent" in key:
                        if k=="group":
                            res_data['binding'] = {v:""}
                            bindKey = v
                for k,v in val.items():
                    print (key + "=>" + str(k) + "," + str(v))
                    if "agent" in key:
                        if k=="path":
                            res_data['binding'][bindKey] = v
                            
            if(type(val)==type(list())):
                for ele in val:
                    if(type(ele)==type(dict())):
                        for k,v in ele.items():
                            if(type(v)==type(list())):
                                for _v in v:
                                    if(type(_v)==type(dict())):
                                        for _k,_v1 in _v.items():
                                            print (key + "=>" + k + "=>" + _k + "," + _v1)
                                            #print key + k + _k + _v1
                            else:
                                print (key + "=>" + str(k) +"," + str(v))
                                

                                
                    else:
                        print (key + "=>" + (ele))
                        if "group" in key:
                            res_data['actor'] = val
        
        for sdata in scenarioData:
            sdata = collections.OrderedDict(sdata)
            for key,val in sdata.items():
                print (key,val)
                if key=="triggers":
                    triggerList.append(val[0]['event'])
                elif key=='trigger':
                    triggerList.append(val)
                    triggerList.append(sdata['method'])
                    triggerList.append("emit")
                    triggerList.append(sdata['method']+"_done")
                elif val=='event' and 'trigger' not in sdata:
                    triggerList.append('actor')
                    triggerList.append(sdata['method'])
                    triggerList.append("emit")
                    triggerList.append(sdata['method']+"_done")

        res_data['scenario']=triggerList
        print(res_data)

        #output as a file
        # with open("DEWtry2.txt","w") as output:
        #     for key,val in res_data.items():
        #         if key=="binding":
        #             output.write(key + "\n")
        #             for k,v in val.items():
        #                 output.write(k + " : "+v)
        #         elif key=="actor":
        #             output.write("\n" + key +" : "+ val[0] + "\n")
        #         else:
        #             output.write("\n"+key + "\nwhen ")
        #             for i in range(0,len(res_data[key])):
        #                 if "done" in res_data[key][i]:
        #                     output.write(res_data[key][i]+" ")
        #                     output.write("\nwhen ")
        #                     for j in range(i+1,len(res_data[key])):
        #                         output.write(res_data[key][j]+" ")
        #                     break
        #                 else:
        #                     output.write(res_data[key][i]+" ")

        #output for api
        dewOutTemp = []
        dewOutScenario = []
        dewOutActor = []
        dewOutConstraints = []
        dewOutBindings = []
        for key,val in res_data.items():
            if key=="binding":
                dewOutTemp.append(key + "\n")
                for k,v in val.items():
                    dewOutTemp.append(k + " : "+v + "\n")
                    dewOutBindings.append(k + " : "+v)
            elif key=="actor":
                dewOutTemp.append(key +" : "+ val[0] + "\n")
                dewOutActor.append(val[0])
            else:
                dewOutTemp.append(key + "\n")
                dewOutTemp.append("when ")
                outScenario = []
                outScenario.append("when ")
                
                for i in range(0,len(res_data[key])):
                    if "done" in res_data[key][i]:
                        dewOutTemp.append(res_data[key][i]+"\n")
                        outScenario.append(res_data[key][i])
                        
                        dewOutScenario.append(''.join(outScenario))
                        outScenario = []

                        dewOutTemp.append("when ")
                        outScenario.append("when ")
                        for j in range(i+1,len(res_data[key])):
                            
                            if(j == len(res_data[key]) - 1):
                                dewOutTemp.append(res_data[key][j]+"\n")
                                outScenario.append(res_data[key][j])
                                
                                dewOutScenario.append(''.join(outScenario))
                                outScenario = []
                            else:
                                dewOutTemp.append(res_data[key][j]+" ")
                                outScenario.append(res_data[key][j]+" ")
                        break
                    else:
                        if(i == len(res_data[key]) - 1):
                            dewOutTemp.append(res_data[key][i]+"\n")
                            outScenario.append(res_data[key][i])
                            
                            dewOutScenario.append(''.join(outScenario))
                            outScenario = []
                        else:
                            dewOutTemp.append(res_data[key][i]+" ")
                            outScenario.append(res_data[key][i]+" ")
        return ''.join(dewOutTemp), dewOutScenario, dewOutConstraints, dewOutBindings, dewOutActor
