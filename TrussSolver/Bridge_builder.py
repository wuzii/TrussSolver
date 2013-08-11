from math import *
from numpy import *
from numpy.linalg import *

TENSION=1
COMPRESSION=-1
PIN=0
ROLLER=1



class Member:
    coor1=(0.0,0.0)
    coor2=(0.0,0.0)
    force_mag=0.0
    force_type=TENSION
    m_id=-1
    
    def __init__(self, _coor1, _coor2, _force_mag=0, _force_type=TENSION):
        self.set_coor(_coor1, _coor2)
        self.length=sqrt((self.coor1[0]-self.coor2[0])**2+(self.coor1[1]-self.coor2[1])**2)
        
    def get_id(self):
        return self.m_id
    
    def get_force_type(self):
        return self.force_type
    
    def set_id(self, _id):
        self.m_id=_id
    
    def set_coor(self, _coor1, _coor2):
        if(isinstance(_coor1,tuple) and isinstance(_coor2,tuple) and len(_coor1)==2 and len(_coor2)==2):
            self.coor1=_coor1
            self.coor2=_coor2
        else:
            print "Error: #00001"
    
    def set_force(self, _force_mag, _force_type):
        self.force_mag=_force_mag
        self.force_type=_force_type
        
    #in radian
    def get_angle(self, _coor):
        if(self.coor1[0]==self.coor2[0]):
            angle_t=math.pi/2
        else:
            angle_t=atan((self.coor1[1]-self.coor2[1])/(self.coor1[0]-self.coor2[0]))
        if(_coor==self.coor2):
            if(self.coor1[1]>self.coor2[1] and self.coor1[0]>=self.coor2[0]):
                angle_r=angle_t
            elif(self.coor1[1]>=self.coor2[1] and self.coor1[0]<self.coor2[0]):
                angle_r=angle_t+math.pi
            elif(self.coor1[1]<self.coor2[1] and self.coor1[0]<=self.coor2[0]):
                angle_r=angle_t+math.pi
            elif(self.coor1[1]<=self.coor2[1] and self.coor1[0]>self.coor2[0]):
                angle_r=angle_t+2*math.pi
        elif(_coor==self.coor1):
            if(self.coor1[1]>self.coor2[1] and self.coor1[0]>=self.coor2[0]):
                angle_r=angle_t+math.pi
            elif(self.coor1[1]>=self.coor2[1] and self.coor1[0]<self.coor2[0]):
                angle_r=angle_t+2*math.pi
            elif(self.coor1[1]<self.coor2[1] and self.coor1[0]<=self.coor2[0]):
                angle_r=angle_t
            elif(self.coor1[1]<=self.coor2[1] and self.coor1[0]>self.coor2[0]):
                angle_r=angle_t+math.pi
        else:
            print "Error: #00006"
        return angle_r
            
        
class Joint:
    coor=(0.0,0.0)
    load_mag=0
    #tail at joint, the angle formed between the load vector and the positive X in degrees
    load_angle=-90.0
    member_list=[]
    
    def __init__(self, _coor, *_member_list):
        self.set_coor(_coor)
        self.member_list=list(_member_list)
    
    def add_member(self, _member):
        if(_member not in self.member_list):
            self.member_list.append(_member)
    
    def get_member_list(self):
        return self.member_list
    
    def get_coor(self):
        return self.coor
    
    def set_coor(self, _coor):
        if(isinstance(_coor,tuple) and len(_coor)==2):
            self.coor=_coor
        else:
            print "Error: #00002"
    
    def set_load(self, load_mag, load_angle):
        self.load_mag=load_mag
        self.load_angle=load_angle
        
    def get_load_mag(self):
        return self.load_mag
    
    def get_load_v(self):
        return -1*self.load_mag*math.sin(self.load_angle/180.0*math.pi)
    
    def get_load_h(self):
        return -1*self.load_mag*math.cos(self.load_angle/180.0*math.pi)

class Support(Joint):
    #[horizontal,vertical]
    support_type=PIN
    id_h=-1
    id_v=-1
    
    def __init__(self, _coor, _support_type=PIN, *_support_force):
        self.set_coor(_coor)
        self.support_type=_support_type
        self.support_force=list(_support_force)
        self.support_force=[0,0]
        self.member_list=[]
        
    def get_type(self):
        return self.support_type
    
    def set_id_h(self, _id_h):
        self.id_h=_id_h
        
    def set_id_v(self, _id_v):
        self.id_v=_id_v
    
    def get_id_h(self):
        return self.id_h
    
    def get_id_v(self):
        return self.id_v
    
    def set_horiz_support_force(self, horiz_support_force):
        self.support_force[0]=horiz_support_force
    
    def set_vert_support_force(self, vert_support_force):
        self.support_force[1]=vert_support_force
    
    def get_horiz_support_force(self):
        return self.support_force[0]
    
    def get_vert_support_force(self):
        return self.support_force[1]
    
class Bridge:
    
    def __init__(self, *args):
        self.list_joint=[]
        self.list_member=[]
        self.list_support=[]
        
    def add_load(self, _coor, load, angle):
        n_J=Joint(_coor)
        n_J.set_load(load, angle)
        self.add_joint(n_J)
        
    def add_joint(self, n_joint):
        if(isinstance(n_joint, Joint) and (n_joint not in self.list_joint)):
            self.list_joint.append(n_joint)
        else:
            print "Error: #00003"
            
    def add_support(self, n_support):
        if(isinstance(n_support, Support) and (n_support not in self.list_support)):
            self.list_support.append(n_support)
        else:
            print "Error: #00005"
    
    def add_member(self, n_member):
        if(isinstance(n_member, Member)):
            if(n_member.coor1!=n_member.coor2):
                self.list_member.append(n_member)
            else:
                print "Error: #00006"
        else:
            print "Error: #00004"
    
    def add_joints_by_members(self):
    #should be used when there are only members, joints with loads but no associated members, and supports with support types. 
        for i in self.list_member:
            coor1_added=False
            coor2_added=False
            for j in self.list_joint:
                if(i.coor1==j.coor):
                    j.add_member(i)
                    coor1_added=True;
                if(i.coor2==j.coor):
                    j.add_member(i)
                    coor2_added=True
            for k in self.list_support:
                if(i.coor1==k.coor):
                    k.add_member(i)
                    coor1_added=True;
                if(i.coor2==k.coor):
                    k.add_member(i)
                    coor2_added=True
            if(coor1_added==False):
                J1=Joint(i.coor1)
                J1.add_member(i)
                self.add_joint(J1)
            if(coor2_added==False):
                J2=Joint(i.coor2)
                J2.add_member(i)
                self.add_joint(J2)
        for i in self.list_support:
            for j in self.list_joint:
                if(i.coor==j.coor):
                    n_S=Support(j.coor,i.get_type())
                    n_S.member_list=j.member_list
                    self.list_support.remove(i)
                    self.list_support.append(n_S)
                    self.list_joint.remove(j)
        
    def get_num_eqn(self):
        n=len(self.list_support)+len(self.list_joint)
        return n*2
    
    def get_num_unknown(self):
        num_support_force=0
        for i in self.list_support:
            if i.support_type==PIN:
                num_support_force=num_support_force+2
            elif i.support_type==ROLLER:
                num_support_force=num_support_force+1
        return (num_support_force+len(self.list_member))

    def solve(self):
        coeff_matrix=zeros((self.get_num_eqn(),self.get_num_unknown()))
        result_matrix=zeros((self.get_num_eqn(),1))
        for i in range(0,len(self.list_member)):
            self.list_member[i].set_id(i)
        
        j=len(self.list_member)
        for i in self.list_support:
            i.set_id_v(j)
            j=j+1
            if(i.get_type()==PIN):
                i.set_id_h(j)
                j=j+1
        
        k=0
        for i in self.list_joint:
            for j in i.member_list:
                #horizontal
                angle=j.get_angle(i.get_coor())
                coeff_h=math.cos(angle)
                #vertical
                coeff_v=math.sin(angle)
                if(j.get_force_type==COMPRESSION):
                    coeff_h=coeff_h*-1.0
                    coeff_v=coeff_v*-1.0
                coeff_matrix[k,j.get_id()]=coeff_h
                coeff_matrix[k+1,j.get_id()]=coeff_v
            result_matrix[k,0]=i.get_load_h()
            result_matrix[k+1,0]=i.get_load_v()
            k=k+2
        
        for i in self.list_support:
            for j in i.member_list:
                #horizontal
                angle=j.get_angle(i.get_coor())
                coeff_h=math.cos(angle)
                #vertical
                coeff_v=math.sin(angle)
                if(j.get_force_type==COMPRESSION):
                    coeff_h=coeff_h*-1.0
                    coeff_v=coeff_v*-1.0
                coeff_matrix[k,j.get_id()]=coeff_h
                coeff_matrix[k+1,j.get_id()]=coeff_v
            coeff_matrix[k+1,i.get_id_v()]=1.0
            if(i.get_type()==PIN):
                coeff_matrix[k,i.get_id_h()]=1.0
                k=k+2
            else:
                k=k+1
        
        #print array_repr(coeff_matrix)
        #print array_repr(result_matrix)
        ans_matrix=solve(coeff_matrix, result_matrix)
        #print array_repr(ans_matrix)
        for i in self.list_member:
            force=ans_matrix[i.get_id(),0]
            if(force<0):
                i.set_force(abs(force),i.get_force_type()*-1)
            else:
                i.set_force(force,i.get_force_type())
        
        for i in self.list_support:
            if (i.get_type()==PIN):
                i.set_horiz_support_force(ans_matrix[i.get_id_h(),0])
            i.set_vert_support_force(ans_matrix[i.get_id_v(),0])
    
    def print_bridge(self):
        print "------------------------------\n"
        print "MEMBERS:\n"
        for i in self.list_member:
            t=i.coor1,"-",i.coor2," :  ",i.force_mag,"   ",i.force_type,"\n"
            print t
        print "SUPPORTS:\n"
        for i in self.list_support:
            t=i.coor," :   H: ",i.get_horiz_support_force(),"   V: ",i.get_vert_support_force(),"\n"
            print t
            
        
                
            
        
                
                

    
        