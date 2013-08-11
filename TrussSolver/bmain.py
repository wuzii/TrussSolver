import sys
import webapp2
from Bridge_builder import *

mainpage="""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="description" content="Online Truss Solver using method of joints">
<meta name="keywords" content="Truss Solver, Truss, Truss Bridge, Truss calculation, Engineering Science, University of Toronto, Truss analysis, Truss calculator">
<title>Truss Solver</title>
<link rel="stylesheet" type="text/css" href="/trusssolver/stylesheets/mainpage-min.css" />
<link type="text/css" href="/trusssolver/stylesheets/blitzer/jquery-ui-1.8.20.custom.css" rel="stylesheet" />
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
<script type="text/javascript" src="/trusssolver/js/jquery-ui-1.8.20.custom.min.js"></script>
<script type="text/javascript" src="/trusssolver/js/raphael-min.js"></script>
<script type="text/javascript" src="/trusssolver/js/UI-min.js"></script>
   

<script type="text/javascript">

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-32146905-1']);
  _gaq.push(['_setDomainName', 'stevenhe.com']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();

</script>
</head>


<body>
<div id="loading" style="background-image:url(/trusssolver/pic/loading.gif);
	background-repeat:no-repeat;
	background-position:center;
	height:100%;
	width:100%;
	z-index:2;"></div>
<div id="container">
<div id="tool_describe"><p></p></div>
	<div id="content">
        <div id="header"><a href="http://engsci.stevenhe.com/trusssolver"><img id="logo" src="/trusssolver/pic/logo.png" width="210" height="34" alt="Truss Solver" /></a>
        <p>Solves simple 2-D trusses using <a target="_blank" href="http://www.civ.utoronto.ca/sect/coneng/i2c/civ100/CIV100_Final%20Website/Lectures/Civ100-M3.pdf">Method of Joints</a></p>
        </div>
        <div id="panel">
        	<div id="top_panel">
            	<div id="top_input"></div>
            	<div id="button_solve"><button id="b_solve" name="solve" type="button"><img src="/trusssolver/pic/b_solve.gif" width="14" height="16" />Solve</button></div>
            </div>
            
            <div id="bottom_panel">
            	<div id="left_bar">
                	<div id="button_select" class="button_up" style="background-image:url(/trusssolver/pic/select.gif)"></div>
                	<div id="button_member" class="button_up" style="background-image:url(/trusssolver/pic/member.gif)"></div>
                    <div id="button_pin_support" class="button_up" style="background-image:url(/trusssolver/pic/pin.gif)"></div>
                    <div id="button_roller_support" class="button_up" style="background-image:url(/trusssolver/pic/roller.gif)"></div>
                    <div id="button_load" class="button_up" style="background-image:url(/trusssolver/pic/load.gif)"></div>
                </div>
                <div id="canvas"></div>
                <div id="right_bar"><h1>Tips:</h1><p>1. Select a part and press <b>"Delete"</b> to delete it.</p><p>2. Try hold the <b>"Shift"</b> key while placing members and loads.</p></div>
            </div>
        </div>
        <div id="footer">
        <iframe src="//www.facebook.com/plugins/like.php?href=http%3A%2F%2Fengsci.stevenhe.com%2Ftrusssolver&amp;send=false&amp;layout=standard&amp;width=420&amp;show_faces=true&amp;action=recommend&amp;colorscheme=dark&amp;font&amp;height=80&amp;appId=387168974653015" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:420px; height:80px;" allowTransparency="true"></iframe><p>Truss Solver by <a href="http://www.linkedin.com/pub/wenhao-steven-he/23/437/11" target="_blank">Wenhao(Steven) He</a>, University of Toronto Engineering Science <br/>Last Update:2012-05-24</p></div>
    </div>
</div>

</body>
</html>
"""


class MainPage(webapp2.RequestHandler):
    def get(self):
        #self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write(mainpage)
        
class Solve(webapp2.RequestHandler):
    def post(self):
        try:
            num_member=int(self.request.get("n_m"))
            num_load=int(self.request.get('n_l'))
            num_p_support=int(self.request.get('n_ps'))
            num_r_support=int(self.request.get('n_rs'))
            B=Bridge()
            for i in range(num_member):
                x1=float(self.request.get("m"+str(i)+"x1"))
                y1=float(self.request.get("m"+str(i)+"y1"))
                x2=float(self.request.get("m"+str(i)+"x2"))
                y2=float(self.request.get("m"+str(i)+"y2"))
                m=Member((x1,y1),(x2,y2))
                B.add_member(m)
            for i in range(num_p_support):
                x=float(self.request.get("ps"+str(i)+"x"))
                y=float(self.request.get("ps"+str(i)+"y"))
                p_s=Support((x,y))
                B.add_support(p_s)
            for i in range(num_r_support):
                x=float(self.request.get("rs"+str(i)+"x"))
                y=float(self.request.get("rs"+str(i)+"y"))
                r_s=Support((x,y),1)
                B.add_support(r_s)
            for i in range(num_load):
                x=float(self.request.get("l"+str(i)+"x"))
                y=float(self.request.get("l"+str(i)+"y"))
                angle=float(self.request.get("l"+str(i)+"a"))
                load=float(self.request.get("l"+str(i)+"m"))
                B.add_load((x,y),load,angle)
            
            B.add_joints_by_members()
            B.solve()
            out=""
            for i in B.list_member:
                out=out+str(i.force_mag)+"&"+str(i.force_type)+'_'
            out=out.rstrip('_')
            out=out+"S"
            for i in B.list_support:
                out=out+str(i.get_horiz_support_force())+"&"+str(i.get_vert_support_force())+'_'
            out=out.rstrip('_')
            
        except:
            out="Error: "+str(sys.exc_info()[1])
        self.response.out.write(out)
        
        
app = webapp2.WSGIApplication([('/trusssolver/?', MainPage),
                                      ('/trusssolver/solve/?',Solve)],
                                     debug=True)