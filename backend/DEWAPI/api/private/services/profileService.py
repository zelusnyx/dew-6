from extensions import db
from DEWAPI.models.deterlab_account_details import DeterlabAccountDetails
from datetime import datetime
from DEWAPI.encryption import AESCipher
from DEWAPI import settings

aESCipher = AESCipher(settings.ENCRYPTION_KEY)

class ProfileService(object):
    def save(self, uid, username, password):
        u = DeterlabAccountDetails.query.filter(DeterlabAccountDetails.uid == uid).first()
        
        password = aESCipher.encrypt(password).decode('utf-8')
        e = DeterlabAccountDetails(uid=uid, username=username, password=password, isdeleted=False)
        db.session.add(e)
        db.session.commit()

        return "Successful"

    def delete(self, uid, daid):
        u = DeterlabAccountDetails.query.filter(DeterlabAccountDetails.uid == uid, DeterlabAccountDetails.daid == daid).first()

        if u is not None:
            u.isdeleted = True
            u.updated_at = datetime.utcnow()
            db.session.commit()

        return "Successful"
    
    def get(self, userId, daid):
        u = DeterlabAccountDetails.query.filter(DeterlabAccountDetails.uid == userId, DeterlabAccountDetails.daid == daid,DeterlabAccountDetails.isdeleted == False).first()
        
        if u is None:
            return {"username":"","password":""}
        else:
            result = {}
            detailObject = u.to_dict()
            result['id'] = detailObject['daid']
            result['username'] = detailObject['username']
            result['password'] = aESCipher.decrypt(detailObject['password']).decode('utf-8')
            return result  

    def getList(self, userId):
        u = DeterlabAccountDetails.query.filter(DeterlabAccountDetails.uid == userId, DeterlabAccountDetails.isdeleted == False)
        
        if u is None:
            return []
        else:
            result = []
            for a in u:
                r = {}
                detailObject = a.to_dict()
                r['id'] = detailObject['daid']
                r['username'] = detailObject['username']
                r['created_date'] = detailObject['created_at'].strftime("%d %B, %Y")
                result.append(r)
            return result  
    def getUserList(self,uid):
        u = DeterlabAccountDetails.query.filter(DeterlabAccountDetails.uid == uid, DeterlabAccountDetails.isdeleted == False)
        result = []
        for x in u:
            detailObject = x.to_dict()
            r = {}
            r['username'] = detailObject['username']
            r['id'] = detailObject['daid']
            result.append(r)
        return result  
