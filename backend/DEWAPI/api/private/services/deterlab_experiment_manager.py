from extensions import db
from DEWAPI.models.user import User
from DEWAPI.models.experiment_deter_mapping import DeterLabExperimentMapping
from DEWAPI.models.deterlab_run_script_log import DeterlabRunScriptLogs
from DEWAPI.models.access_control import AccessControl
from utilities.access_control_enum import AccessControlEnum
from datetime import datetime



class DeterLabExperimentManager(object):
    
    def createOrModifyMapping(self, daid, experiment_id, project_name, experiment_name):
        m = DeterLabExperimentMapping.query.filter(DeterLabExperimentMapping.daid == daid , DeterLabExperimentMapping.experiment_id == experiment_id , DeterLabExperimentMapping.isdeleted == False).first()

        if m is None:
            mapping = DeterLabExperimentMapping(daid=daid, experiment_id=experiment_id, project_name=project_name, experiment_name=experiment_name,isdeleted=False)
            db.session.add(mapping)
        else:
            m.project_name = project_name
            m.experiment_id = experiment_id
            m.experiment_name = experiment_name
            m.updated_at = datetime.utcnow()
            m.isdeleted = False
            db.session.add(m)
        
        db.session.commit()

        return "Successful"
    
    def getMapping(self, daid, experiment_id):
        result = {}
        m = DeterLabExperimentMapping.query.filter(DeterLabExperimentMapping.daid == daid, DeterLabExperimentMapping.experiment_id == experiment_id, DeterLabExperimentMapping.isdeleted == False).first()
        
        if m is None:
            result['error'] = 'No Mapping Found.'
        else:
            result['mapping_id'] = m.mid
            result['project_name'] = m.project_name
            result['experiment_name'] = m.experiment_name
        
        return result
    def user_can(self, uid, experiment_id):
        ac = AccessControl.query.filter(AccessControl.experiment_id == experiment_id, AccessControl.uid == uid,
                                        AccessControl.expiry_date > datetime.today(),
                                        AccessControl.access_level >= AccessControlEnum.read.value).first()
        # print(ac)
        return ac is not None

    def deleteMapping(self, daid, experiment_id):
        m = DeterLabExperimentMapping.query.filter(DeterLabExperimentMapping.daid == daid, DeterLabExperimentMapping.experiment_id == experiment_id, DeterLabExperimentMapping.isdeleted == False).first()
        
        if m is not None:
            m.isdeleted = True
            m.updated_at = datetime.utcnow()
            db.session.add(m)
            db.session.commit()
        
        return "Successful"

    def addLog(self, eid, daid, uid, transaction_id, unique_name, variables,action, run_script):
        d = DeterlabRunScriptLogs(daid=daid, eid=eid, uid=uid, version_id=transaction_id,unique_name=unique_name,isdeleted=False, run_variable_value=variables, action=action, run_script = run_script)
        db.session.add(d)
        db.session.commit()

    def getStatus(self, eid, uid, unique_name):
        d = DeterlabRunScriptLogs.query.filter(DeterlabRunScriptLogs.unique_name == unique_name, DeterlabRunScriptLogs.eid == eid, DeterlabRunScriptLogs.uid == uid,DeterlabRunScriptLogs.isdeleted == False)
        result = ""
        if d is not None:
            for x in d:
                result = x.action
        return result

    def updateRunLogLogs(self, eid, uid, unique_name, logs):
        d = DeterlabRunScriptLogs.query.filter(DeterlabRunScriptLogs.unique_name == unique_name, DeterlabRunScriptLogs.eid == eid, DeterlabRunScriptLogs.uid == uid,DeterlabRunScriptLogs.isdeleted == False).order_by(DeterlabRunScriptLogs.created_at.desc()).first()
        result = ""
        if d is not None:
            if d.action == "start":
                print(logs)
                d.logs = logs
                db.session.add(d)
        db.session.commit()    

        return "Successful"
                  
    def getLogs(self, eid, daid, uid):
        d = DeterlabRunScriptLogs.query.filter(DeterlabRunScriptLogs.daid == daid, DeterlabRunScriptLogs.eid == eid, DeterlabRunScriptLogs.uid == uid,DeterlabRunScriptLogs.isdeleted == False, DeterlabRunScriptLogs.action == 'start')
        result = []
        if d is not None:
            for x in d:
                r = {}
                r['id'] = x.rsid
                r['started_at'] = x.created_at.strftime("%Y-%m-%dT%H:%M:%S") + ".000Z"
                r['filename'] = x.unique_name
                result.append(r)
        return result

    def getLogLogs(self, eid, uid, unique_name, rsid):
        d = DeterlabRunScriptLogs.query.filter(DeterlabRunScriptLogs.unique_name == unique_name, DeterlabRunScriptLogs.eid == eid, DeterlabRunScriptLogs.uid == uid,DeterlabRunScriptLogs.isdeleted == False,DeterlabRunScriptLogs.rsid == rsid).first()
        if d is not None:
            return d.logs

        return ""

    def getRunScript(self, eid, uid, unique_name, rsid):
        d = DeterlabRunScriptLogs.query.filter(DeterlabRunScriptLogs.unique_name == unique_name, DeterlabRunScriptLogs.eid == eid, DeterlabRunScriptLogs.uid == uid,DeterlabRunScriptLogs.isdeleted == False,DeterlabRunScriptLogs.rsid == rsid).first()
        if d is not None:
            return d.run_script

        return ""
        
    def getVersion(self, rsid, uid,daid):
        d = DeterlabRunScriptLogs.query.filter(DeterlabRunScriptLogs.rsid == rsid, DeterlabRunScriptLogs.uid == uid, DeterlabRunScriptLogs.daid == daid,DeterlabRunScriptLogs.isdeleted == False).first()
        if d is None:
            return None
        else:
            return d
            
