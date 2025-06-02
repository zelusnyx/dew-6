import requests

from flask import request,jsonify
from DEWAPI.models.user import User
from DEWAPI.models.access_control import AccessControl
from utilities.access_control_enum import AccessControlEnum
from datetime import datetime
from extensions import db
class GoogleLogin():
    def validate(self,token):
        userInfo = self.googleUserInfo(token)
        result = {}
        if userInfo is not None:
            u = User.query.filter(userInfo['userId'] == User.uid).first()
            if u is None:
                result['error'] = 'Invalid User'
                result['navigateTo'] = 'registration'
            else:
                result = userInfo
            return result
        else:
            return {"error":"invalid token"}, 401
    def googleUserInfo(self,token):
        try:
            # Specify the CLIENT_ID of the app that accesses the backend:
            CLIENT_ID = '926607687771-0lll564e4sbjo4davt10fufmhuehgl1s.apps.googleusercontent.com'
            response = requests.get("https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token="+token).json()
            # response.content
            # print(request.get_json(response.content))
            userId = response['email'].split('@')[0]
            uid = userId +"-"+ response['id']
            result = {}
            result['emailId'] = response['email']
            result['givenName'] = response['given_name']
            result['lastName'] = response['family_name']
            result['img'] = response['picture']
            result['fullName'] = response['name']
            result['userId'] = uid
            return result
        except KeyError as e:
            # Invalid token
            # print('error')
            return None
        except ValueError as e:
            return None
    def getUserInfo(self,token):
        googleUserObject = self.googleUserInfo(token)
        result = {}
        if googleUserObject is not None:
            r = self.getOrStoreUserInfo(uid=googleUserObject['userId'],emailId=googleUserObject['emailId'],username=googleUserObject['userId'],name=googleUserObject['fullName'],access_token=token)
            if r is not None:
                result['emailId'] = r['email']
                result['fullName'] = r['name']
                result['givenName'] = googleUserObject['givenName']
                result['img'] = googleUserObject['img']
                result['lastName'] = googleUserObject['lastName']
                result['userHandle'] = r['username']
                return result
            else:
                return {'error':'Unknown user'}, 401
        else:
            return {'error':'Invalid Token'}, 401
    def getLoginUserDetail(self, token):
        googleUserObject = self.googleUserInfo(token)
        if googleUserObject is not None:
            r = self.getOrStoreUserInfo(uid=googleUserObject['userId'],emailId=googleUserObject['emailId'],username=googleUserObject['userId'],name=googleUserObject['fullName'],access_token=token)
            if r is not None:
                googleUserObject['userHandle'] = r['username']
                return googleUserObject
        
        return None
    
    def getOrStoreUserInfo(self,uid,username,name,emailId,access_token):
        u = User.query.filter(User.uid == uid).first()
        return u.to_dict()
    def validateHandle(self, handle):
        u = User.query.filter(User.username == handle.lower()).first()
        if u is None:
            return {'valid':True}
        else:
            return {'valid':False}
    def registerUserHandle(self,handle,token):
        
        if self.validateHandle(handle)['valid']:
            result = self.googleUserInfo(token)
            if result is None:
                return {'error':'token is invalid. Please try again','navigate':'login'}
            else:
                u = User(uid=result['userId'],email=result['emailId'],username=handle.lower(),name=result['fullName'],access_token=token)
                db.session.add(u)
                db.session.commit()
                return {'message':'Successfully created!'}
        else:
            return {'error':'Handle is already taken','navigate':'login'}
    def getUserHandles(self,uid):
        u = User.query.filter(User.uid != uid).all()
        r = [{'name':i.name,'handle':i.username} for i in u]
        result = {'userList':r}
        return result
    def getUserAccessList(self,userId,experimentId):
        ac = AccessControl.query.filter(AccessControl.experiment_id==experimentId, AccessControl.uid==userId,AccessControl.expiry_date>datetime.utcnow(), AccessControl.access_level>=AccessControlEnum.manage.value).first()
        result = {}
        if ac is not None:
            ac1 = AccessControl.query.filter(AccessControl.experiment_id==experimentId, AccessControl.uid!=userId,AccessControl.expiry_date>datetime.utcnow(), AccessControl.access_level>AccessControlEnum.none.value).all()
            r = [i.uid for i in ac1] 
            userList = {}
            for i in ac1:
                if i.access_level == AccessControlEnum.read.value:
                    userList[i.uid] = 'Read'
                elif i.access_level == AccessControlEnum.write.value:
                    userList[i.uid] = 'Write'
                elif i.access_level == AccessControlEnum.manage.value:
                    userList[i.uid] = 'Mange'
                else:
                    userList[i.uid] = 'None'
            result['userList'] = [{'name':i.name,'handle':i.username,'accessLevel':userList[i.uid]} for i in User.query.filter(User.uid.in_(r)).all()]
        
        else:
            result = {'error':'Un Authorized user','location':'logout'}
        return result
