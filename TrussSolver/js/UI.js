var TYPE_MEMBER=1,
	TYPE_PIN_SUPPORT=2,
	TYPE_ROLLER_SUPPORT=3,
	TYPE_CIRCLE=4,
	TYPE_LOAD=5;
	
var MEMBER_FILL_COLOR="#0099FF";
var PIN_SUPPORT_FILL_COLOR="#330000";
var ROLLER_SUPPORT_FILL_COLOR="#666600";
var SELECTED_COLOR="#FF0000";
var LOAD_STROKE_COLOR="#333333";
var PIN_SUPPORT_STYLE={"opacity":1};
var PIN_SUPPORT_TEMP_STYLE={"opacity":0.5};
var ROLLER_SUPPORT_STYLE={"opacity":1};
var ROLLER_SUPPORT_TEMP_STYLE={"opacity":0.5};
var LOAD_TEMP_STYLE={stroke:"#333333" ,"stroke-width":3, "stroke-opacity":0.5, "stroke-linejoin":"round"};
var LOAD_STYLE={"stroke-opacity":1};
var MEMBER_RECT_TEMP_STYLE={fill:"#0099FF","fill-opacity":0.5, stroke:"#0099FF" ,"stroke-width":1};
var MEMBER_CIRCLE_TEMP_STYLE={fill:"#999999","fill-opacity":0.5, stroke:"#999999" ,"stroke-width":1};
var MEMBER_CIRCLE_MOUSEOVER_STYLE={fill:"#66FF33","fill-opacity":0.5, stroke:"#999999" ,"stroke-width":2};
var MEMBER_CIRCLE_STYLE={fill:"#999999","fill-opacity":1, stroke:"#999999" ,"stroke-width":1};
var MEMBER_RECT_STYLE={"fill-opacity":1};
	

//covert from screen coor to canvas coor
function cX(x){
	return(x-$("#canvas").offset().left);
}
function cY(y){
	return(y-$("#canvas").offset().top);
}
//convert from canvas coor to screen coor
function cXr(x){
	return(x+$("#canvas").offset().left);
}
function cYr(y){
	return(y+$("#canvas").offset().top);
}
function coor(type,x1,y1,x2,y2){ //or (type,x,y,load_angle,load_mag) for load
	this.type=type;
	this.x=x1;
	this.y=y1;
	this.x1=x1;
	this.y1=y1;
	this.x2=x2;
	this.y2=y2;
	if(this.type==TYPE_LOAD){
		this.load_angle=x2;
		this.load_mag=y2;
	}
}

$(document).ready(function(){
	
	var general_scale=1;	//pixels * general_scale=actual length
	var CANVAS_SIZE=600;	//in px
	var general_unit="m";
	var BUTTON_SELECT=1;
	var BUTTON_MEMBER=2;
	var BUTTON_PIN_SUPPORT=3;
	var BUTTON_ROLLER_SUPPORT=4;
	var BUTTON_LOAD=5;
	
	var button_clicked=-1;
	
	//********************************************************
	var paper=Raphael("canvas",700,670);
	
	//***Variebles used when drawing Menbers********************************
	var click_count=2;		//2 indicates before placing the 1st circle(ie after placing the second circle)
	var x1;
	var y1;
	var x1_in_circle=-1;
	var y1_in_circle=-1;
	var x2;
	var y2;
	var x2_in_circle=-1;
	var y2_in_circle=-1;
	var shift_down=false;
	var current_rect_id;
	var current_c1_id;
	var arr_member=new Array(); //stores the ids of members
	var arr_element_coor=new Array(); //index is the id of element and stores the coor obeject(coor relative to canvas) of that element
	var MEMBER_RECT_THICK=4;
	var MEMBER_CIRCLE_R=7;
	//********variebles for load*****************************************
	var load_click_count=2;
	var LOAD_LENGTH=60;
	var current_load_id;
	var current_text_id;
	var arr_load=new Array();
	var load_angle=0;
	var load_mag=10;
	var LOAD_ARROW_LENGTH=5;
	//******variebles for select******************** 
	var element_selected_id=-1;
	
	//**********variebles for pin support******************
	var SUPPORT_TRI_WIDTH=30;
	var SUPPORT_TRI_HEIGHT=30;
	var temp_pin_support_id
	var current_support_id;
	var suppot_x_ini=-100;
	var suppot_y_ini=-100;
	var arr_pin_support=new Array(); //stores the ids of pin supports
	var PIN_PIC_PATH="/trusssolver/pic/pin_pic.gif";
	var PIN_SELECTED_PATH="/trusssolver/pic/pin_pic_selected.gif";
	
	//**********variebles for roller support******************
	var temp_roller_support_id
	var arr_roller_support=new Array(); //stores the ids of pin supports
	var ROLLER_PIC_PATH="/trusssolver/pic/roller_pic.gif";
	var ROLLER_SELECTED_PATH="/trusssolver/pic/roller_pic_selected.gif";
	
	//**********variebles for labels**************************
	var arr_point_hash=new Array();
	var arr_label=new Array();
	
	//**********functions and listeners**********************************************************************************
	function c_alert(title,line1,line2){
		var dialog_HTML='<div id="dialog-message" title="'+title+'"><p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 50px 0;"></span>'+line1+'</p><p>'+line2+'</p></div>'
		$("#container").append(dialog_HTML);
		$( "#dialog:ui-dialog" ).dialog( "destroy" );
	
		$( "#dialog-message" ).dialog({
			draggable: false,
			resizable: false,
			modal: true,
			buttons: {
				Ok: function() {
					$( this ).dialog( "close" );
				}
			}
		});
	}
	function set_scale(){
		var dialog_HTML='<div id="dialog-form" title="Welcome"><p>Please specify the maximum length or width (whichever is longer) of your structure and the unit you will be using:</p><p><label for="length">Length: </label><input id="scale_length" name="length" value="600" type="text" /><label for="unit">  Unit: </label><input id="scale_unit" name="unit" value="m" type="text" /></p><p id="tips"></p></div>'
		$("#container").append(dialog_HTML);
		$( "#dialog-form" ).dialog({
				//autoOpen: false,
				draggable: false,
				resizable: false,
				width: 400,
				modal: true,
				buttons: {
					"Start": function() {
						var length=$('#scale_length').val();
						if($.isNumeric(length)==true && parseFloat(length)>0){
							general_scale=length/CANVAS_SIZE;
							general_unit=$('#scale_unit').val();
							$( this ).dialog( "close" );
						}
						else{
							$("#tips").html( "* Length must be a positive number" ).addClass( "ui-state-highlight" );
							$("#scale_length").addClass( "ui-state-error" );
						}
					}
				},
				close: function() {
				}
			});
	}
	function ini_env(){
		$("#tool_describe").hide();
		$("#loading").hide("fast");
		var tri1 = paper.image(PIN_SELECTED_PATH, -100, -100, SUPPORT_TRI_WIDTH, SUPPORT_TRI_HEIGHT);
		var tri2 = paper.image(ROLLER_SELECTED_PATH, -100, -100, SUPPORT_TRI_WIDTH, SUPPORT_TRI_HEIGHT);
		tri1.remove();
		tri2.remove();
		
		set_scale();
	}
	
	$(document).keydown(function(e2) {		//shirft
		if(e2.which==16){
			shift_down=true;
		}
	});
	$(document).keyup(function(e3) {
		if(e3.which==16){
			shift_down=false;
		}
	});
	
	function click_button(button, id, top_html){
		if(button_clicked!=button){
			$('#left_bar > .button_down').removeClass("button_down").addClass("button_up");
			$(id).removeClass("button_up").addClass("button_down");
			$('#top_input').html(top_html);
		}
		button_clicked=button;
		paper.getById(temp_roller_support_id).hide();
		paper.getById(temp_pin_support_id).hide();
	}
	function mouse_enter_button(id,text){
		var os=$(id).offset();
		$("#tool_describe").css({'left' : os.left+40, 'top' : os.top+5, 'width': 'auto', 'height': 'auto'});
		$("#tool_describe").text(text);
		$("#tool_describe").show("fast");
	}
	
	$("#button_member").click(function() {
		click_button(BUTTON_MEMBER, '#button_member', '<div class="top_box">(x1: <input class="top_coor_input" name="x1" type="text" readonly="true"/>, y1: <input class="top_coor_input" name="y1" type="text" readonly="true"/>) (x2: <input class="top_coor_input" name="x2" type="text" readonly="true"/>, y2: <input class="top_coor_input" name="y2" type="text" readonly="true"/>)</div><div class="top_box">Length: <input class="top_num_input" name="length" type="text" />'+general_unit+'&nbsp;&nbsp;Angle: <input class="top_num_input" name="angle" type="text" /><button name="set_member" type="button">set</button></div>');
	}).mouseenter(function() {
		mouse_enter_button("#button_member","Member")
	}).mouseleave(function() {
		$("#tool_describe").stop().hide(25);
	});
	
	$("#button_select").click(function() {
		click_button(BUTTON_SELECT, "#button_select", '<div class="top_box">(x: <input class="top_coor_input" name="x1" type="text" readonly="true"/>, y: <input class="top_coor_input" name="y1" type="text" readonly="true"/>)</div>');
	}).mouseenter(function() {
		mouse_enter_button("#button_select","Select")
	}).mouseleave(function() {
		$("#tool_describe").stop().hide(25);
	});
	
	$("#button_pin_support").click(function() {
		click_button(BUTTON_PIN_SUPPORT, "#button_pin_support", '<div class="top_box">(x: <input class="top_coor_input" name="x1" type="text" readonly="true"/>, y: <input class="top_coor_input" name="y1" type="text" readonly="true"/>)</div>');
		paper.getById(temp_pin_support_id).show();
	}).mouseenter(function() {
		mouse_enter_button("#button_pin_support","Pin Support")
	}).mouseleave(function() {
		$("#tool_describe").stop().hide(25);
	});
	
	$("#button_roller_support").click(function() {
		click_button(BUTTON_ROLLER_SUPPORT, "#button_roller_support", '<div class="top_box">(x: <input class="top_coor_input" name="x1" type="text" readonly="true"/>, y: <input class="top_coor_input" name="y1" type="text" readonly="true"/>)</div>');
		paper.getById(temp_roller_support_id).show();
	}).mouseenter(function() {
		mouse_enter_button("#button_roller_support","Roller Support")
	}).mouseleave(function() {
		$("#tool_describe").stop().hide(25);
	});
	
	$("#button_load").click(function() {
		click_button(BUTTON_LOAD, "#button_load", '<div class="top_box">(x: <input class="top_coor_input" name="x1" type="text" readonly="true"/>, y: <input class="top_coor_input" name="y1" type="text" readonly="true"/>)</div><div class="top_box">Magnitute: <input class="top_num_input" name="magnitute" type="text" />Angle: <input class="top_num_input" name="angle" type="text" /><button name="set_load" type="button">set</button></div>');
	}).mouseenter(function() {
		mouse_enter_button("#button_load","Load")
	}).mouseleave(function() {
		$("#tool_describe").stop().hide(25);
	});
	
	function ini_temp_supports(){
		var x=suppot_x_ini;
		var y=suppot_y_ini;
		var tri_pin = paper.image(PIN_PIC_PATH, x, y, SUPPORT_TRI_WIDTH, SUPPORT_TRI_HEIGHT);
		tri_pin.attr(PIN_SUPPORT_TEMP_STYLE);
		temp_pin_support_id=tri_pin.id;
		var tri_roller = paper.image(ROLLER_PIC_PATH, x, y, SUPPORT_TRI_WIDTH, SUPPORT_TRI_HEIGHT);
		tri_roller.attr(ROLLER_SUPPORT_TEMP_STYLE);
		temp_roller_support_id=tri_roller.id;
	}
	ini_env();
	ini_temp_supports();
	
	$('#b_solve').click(function(e){
		try{
			e.preventDefault();
			remove_label();
			if(arr_member.length==0){	
				c_alert("Error - Truss Solver", "Please add members using the <b>Member</b> tool on the left panel.","");
			}
			else if(arr_load.length==0){
				c_alert("Error - Truss Solver","Please set the loads of the structure using the <b>Load</b> tool on the left panel.", "");
			}
			else if(arr_pin_support.length+arr_roller_support.length==0){
				c_alert("Error - Truss Solver", "Please add supports using the <b>Support</b> tool on the left panel.", "");
			}
			else{
				//$('#right_bar').html("Establishing server connection...");
				var num_member=arr_member.length;
				var num_load=arr_load.length;
				var num_p_support=arr_pin_support.length;
				var num_r_support=arr_roller_support.length;
				var request_s="";
				request_s=request_s+"n_m="+num_member+"&";
				request_s=request_s+"n_l="+num_load+"&";
				request_s=request_s+"n_ps="+num_p_support+"&";
				request_s=request_s+"n_rs="+num_r_support+"&";
				var i=0;
				for(i=0;i<num_member;i++){
					request_s=request_s+"m"+i+"x1="+arr_element_coor[arr_member[i]].x1+"&";		//m0x1.....
					request_s=request_s+"m"+i+"y1="+arr_element_coor[arr_member[i]].y1+"&";
					request_s=request_s+"m"+i+"x2="+arr_element_coor[arr_member[i]].x2+"&";
					request_s=request_s+"m"+i+"y2="+arr_element_coor[arr_member[i]].y2+"&";
				}
				for(i=0;i<num_p_support;i++){
					request_s=request_s+"ps"+i+"x="+arr_element_coor[arr_pin_support[i]].x+"&";		//ps0x......
					request_s=request_s+"ps"+i+"y="+arr_element_coor[arr_pin_support[i]].y+"&";
				}
				for(i=0;i<num_r_support;i++){
					request_s=request_s+"rs"+i+"x="+arr_element_coor[arr_roller_support[i]].x+"&";		//rs0x......
					request_s=request_s+"rs"+i+"y="+arr_element_coor[arr_roller_support[i]].y+"&";
				}
				for(i=0;i<num_load;i++){
					request_s=request_s+"l"+i+"x="+arr_element_coor[arr_load[i]].x+"&";		//l0x......
					request_s=request_s+"l"+i+"y="+arr_element_coor[arr_load[i]].y+"&";
					request_s=request_s+"l"+i+"a="+arr_element_coor[arr_load[i]].load_angle+"&";	//l0a....
					request_s=request_s+"l"+i+"m="+arr_element_coor[arr_load[i]].load_mag+"&";		//l0m....
				}
				request_s=request_s+"end=1";
				//alert(request_s);
				var xmlhttp;
				if(window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
					xmlhttp=new XMLHttpRequest();
				}
				else{// code for IE6, IE5
					xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
				}
				xmlhttp.onreadystatechange=function(){
					if (xmlhttp.readyState==4 && xmlhttp.status==200){
						var response=xmlhttp.responseText;
						if(response.indexOf("Error")==-1){
							var arr_str=response.split("S");
							var arr_str_m=arr_str[0].split("_");
							var arr_str_s=arr_str[1].split("_");
							var i;
							var arr_m=new Array();
							var arr_s=new Array();
		
							var ii=arr_str_m.length;
							for(i=0;i<ii;i++){
								arr_m[i]=new Array();
								arr_m[i][0]=arr_str_m[i].split("&")[0];
								arr_m[i][1]=arr_str_m[i].split("&")[1];
								
							}
							ii=arr_str_s.length;
							for(i=0;i<ii;i++){
								arr_s[i]=new Array();
								arr_s[i][0]=arr_str_s[i].split("&")[0];
								arr_s[i][1]=arr_str_s[i].split("&")[1];
							}
							
							label_member();
							var display_html='<table id="member"><tr><th colspan="3">Member</th></tr>';
							
							for(i=0;i<arr_member.length;i++){
								var str_c1=arr_element_coor[arr_member[i]].x1+"Y"+arr_element_coor[arr_member[i]].y1;
								var str_c2=arr_element_coor[arr_member[i]].x2+"Y"+arr_element_coor[arr_member[i]].y2;
								
								var letter_1=String.fromCharCode(parseInt(arr_point_hash.indexOf(str_c1))+65);
								var letter_2=String.fromCharCode(parseInt(arr_point_hash.indexOf(str_c2))+65);
								display_html=display_html+'<tr><td class="id">'+letter_1+' '+letter_2+'</td>'+'<td class="value">'+arr_m[i][0]+'</td>';
								var type;
								if(arr_m[i][1]==1){
									type="C";
								}
								else{
									type="T";
								}
								display_html=display_html+'<td class="type">'+type+'</td></tr>';
							}
							display_html=display_html+'</table><table id="support"><tr><th colspan="3">Support</th></tr>';
							for(i=0;i<arr_pin_support.length;i++){
								var str_c=arr_element_coor[arr_pin_support[i]].x+"Y"+arr_element_coor[arr_pin_support[i]].y;
								var letter=String.fromCharCode(parseInt(arr_point_hash.indexOf(str_c))+65);
								display_html=display_html+'<tr><td rowspan="2" class="id">'+letter+'</td><td class="type">V</td>'+'<td class="value">'+arr_s[i][1]+'</td></tr><tr><td class="type">H</td><td class="value">'+arr_s[i][0]+'</td></tr>';
							}
							for(i=0;i<arr_roller_support.length;i++){
								var str_c=arr_element_coor[arr_roller_support[i]].x+"Y"+arr_element_coor[arr_roller_support[i]].y;
								var letter=String.fromCharCode(parseInt(arr_point_hash.indexOf(str_c))+65);
								display_html=display_html+'<tr><td rowspan="2" class="id">'+letter+'</td><td class="type">V</td>'+'<td class="value">'+arr_s[i+arr_pin_support.length][1]+'</td></tr><tr><td class="type">H</td><td class="value">'+arr_s[i+arr_pin_support.length][0]+'</td></tr>';
							}
							display_html=display_html+'</table>';
		
							$('#right_bar').html(display_html);
						}
						else{
							c_alert("Error - Truss Solver","This structure is statically indeterminate.","Please review your structure for missing or misplaced parts");	
						}
					}
					
					//c_alert("Connection Error - Truss Solver","404-Please check your internet connection and try again.","Error Message: "+err.message);
				}
				xmlhttp.open("POST","/trusssolver/solve",true);
				xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
				xmlhttp.send(request_s);
			}
		}
		catch(err){
  			alert("Error - Truss Solver","An error has occured while solving the structure. Click 'Ok' to continue."+'\n\n'+"Error Message: "+err.message);
		}
	});
	function label_member(){
		try{
			var i;
			for(i in arr_member){
				var str_c1=arr_element_coor[arr_member[i]].x1+"Y"+arr_element_coor[arr_member[i]].y1;
				var str_c2=arr_element_coor[arr_member[i]].x2+"Y"+arr_element_coor[arr_member[i]].y2;
				if(arr_point_hash.indexOf(str_c1)==-1){
					arr_point_hash[arr_point_hash.length]=str_c1;
				}
				if(arr_point_hash.indexOf(str_c2)==-1){
					arr_point_hash[arr_point_hash.length]=str_c2;
				}
			}
			var ii=arr_point_hash.length;
			var arr_temp=arr_point_hash;
			for(i=0;i<ii;i++){
				var lx=arr_temp[i].split("Y")[0];
				var ly=arr_temp[i].split("Y")[1];
				var letter=String.fromCharCode(i+65);
				var attr = {font: "20px Arial", opacity: 1};
				var label = paper.text(lx-15, ly-15, letter).attr(attr).attr({fill: "#333333"});
				arr_label[i]=label.id;
			}
		}
		catch(err){
			alert("An error has occured while labeling the structure. Click 'Ok' to continue."+'\n\n'+"Error Message: "+err.message);
		}
	}
	function remove_label(){
		try{
			var i;
			for(i in arr_label){
				paper.getById(arr_label[i]).remove();
			}	
			arr_label=new Array();
			arr_point_hash=new Array();
		}
		catch(err){
			alert("An error has occured while removing the labels. Click 'Ok' to continue."+'\n\n'+"Error Message: "+err.message);
		}
	}
	
	$('#canvas').click(function(e) {
		try{
			if(button_clicked==BUTTON_SELECT){
				for (i in arr_member){
					paper.getById(arr_member[i]).attr({fill:MEMBER_FILL_COLOR});
				}
				for (i in arr_pin_support){
					paper.getById(arr_pin_support[i]).attr({"src":PIN_PIC_PATH});
				}
				for (i in arr_roller_support){
					paper.getById(arr_roller_support[i]).attr({"src":ROLLER_PIC_PATH});
				}
				for (i in arr_load){
					paper.getById(arr_load[i]).attr({stroke:LOAD_STROKE_COLOR});
				}
				element_selected_id=-1;
				
				if(paper.getElementByPoint(e.pageX, e.pageY)!=null){
					element_selected_id=paper.getElementByPoint(e.pageX, e.pageY).id;
					if(arr_member.indexOf(paper.getElementByPoint(e.pageX, e.pageY).id)!=-1){	//if selected a member
						paper.getById(element_selected_id).attr({fill:SELECTED_COLOR});
						$('#top_input').html('<div class="top_box">(x1: <input class="top_coor_input" name="x1" type="text" readonly="true"/>, y1: <input class="top_coor_input" name="y1" type="text" readonly="true"/>) (x2: <input class="top_coor_input" name="x2" type="text" readonly="true"/>, y2: <input class="top_coor_input" name="y2" type="text" readonly="true"/>)</div><div class="top_box">Length: <input class="top_num_input" name="length" type="text" readonly="true"/>Angle: <input class="top_num_input" name="angle" type="text" readonly="true"/></div>');
						var tx1=arr_element_coor[element_selected_id].x1;
						var ty1=arr_element_coor[element_selected_id].y1;
						var tx2=arr_element_coor[element_selected_id].x2;
						var ty2=arr_element_coor[element_selected_id].y2;
						$('input[name="length"]').val(general_scale*Math.sqrt((tx1-tx2)*(tx1-tx2)+(ty1-ty2)*(ty1-ty2)));
						$('input[name="x1"]').val(arr_element_coor[element_selected_id].x1);
						$('input[name="y1"]').val(arr_element_coor[element_selected_id].y1);
						$('input[name="x2"]').val(arr_element_coor[element_selected_id].x2);
						$('input[name="y2"]').val(arr_element_coor[element_selected_id].y2);
						$('input[name="angle"]').val(360-Raphael.angle(tx2,ty2,tx1,ty1));
					}
					else if(arr_pin_support.indexOf(paper.getElementByPoint(e.pageX, e.pageY).id)!=-1){	//if selected a pin support
						paper.getById(element_selected_id).attr({"src":PIN_SELECTED_PATH});
						$('#top_input').html(' ');
					}
					else if(arr_roller_support.indexOf(paper.getElementByPoint(e.pageX, e.pageY).id)!=-1){	//if selected a roller support
						paper.getById(element_selected_id).attr({"src":ROLLER_SELECTED_PATH});
						$('#top_input').html(' ');
					}
					else if(arr_load.indexOf(paper.getElementByPoint(e.pageX, e.pageY).id)!=-1){	//if selected a load
						paper.getById(element_selected_id).attr({stroke:SELECTED_COLOR});
						$('#top_input').html('<div class="top_box">(x: <input class="top_coor_input" name="x1" type="text" readonly="true"/>, y: <input class="top_coor_input" name="y1" type="text" readonly="true"/>)</div><div class="top_box">Magnitute: <input class="top_num_input" name="magnitute" type="text" readonly="true"/>Angle: <input class="top_num_input" name="angle" type="text" readonly="true"/>');
						$('input[name="magnitute"]').val(arr_element_coor[element_selected_id].load_mag);
						$('input[name="angle"]').val(arr_element_coor[element_selected_id].load_angle);
						$('input[name="x1"]').val(arr_element_coor[element_selected_id].x);
						$('input[name="y1"]').val(arr_element_coor[element_selected_id].y);
					}
					else{
						element_selected_id=-1;
					}	
				}
				$(document).keydown(function(e2) {	//press del
					if(e2.which==46 || e2.which==8){
						try{
							e2.preventDefault();
							if(element_selected_id!=-1){
								remove_label();
								if(arr_member.indexOf(element_selected_id)!=-1){	//if selected a member
									var n=arr_member.indexOf(element_selected_id);
									arr_member.splice(n,1);
									var e_set=new Array(paper.getElementsByPoint(arr_element_coor[element_selected_id].x1,arr_element_coor[element_selected_id].y1), paper.getElementsByPoint(arr_element_coor[element_selected_id].x2,arr_element_coor[element_selected_id].y2));
									var i=0;
									for(i=0;i<=1;i++){
										e_set[i].forEach(function(e3){
											if(arr_element_coor[e3.id].type==TYPE_CIRCLE){
												arr_element_coor[e3.id]=null;
												e3.remove();
												return false;
											}
										});
									}
									paper.getById(element_selected_id).remove();
									arr_element_coor[element_selected_id]=null;
								}
								else if(arr_pin_support.indexOf(element_selected_id)!=-1){		//if selected a pin support
									var n=arr_pin_support.indexOf(element_selected_id);
									arr_pin_support.splice(n,1);
									paper.getById(element_selected_id).remove();
									arr_element_coor[element_selected_id]=null;
								}
								else if(arr_roller_support.indexOf(element_selected_id)!=-1){		//if selected a roller support
									var n=arr_roller_support.indexOf(element_selected_id);
									arr_roller_support.splice(n,1);
									paper.getById(element_selected_id).remove();
									arr_element_coor[element_selected_id]=null;
								}
								else if(arr_load.indexOf(element_selected_id)!=-1){		//if selected a roller support
									var n=arr_load.indexOf(element_selected_id);
									arr_load.splice(n,1);
									paper.getById(element_selected_id).remove();
									arr_element_coor[element_selected_id]=null;
								}
							}
						}
						catch(err){
							alert("An error has occured while deleting an element. Click 'Ok' to continue."+'\n\n'+"Error Message: "+err.message);
						}
					}
				});
			}
			else if(button_clicked==BUTTON_PIN_SUPPORT || button_clicked==BUTTON_ROLLER_SUPPORT){
				if(x1_in_circle!=-1 && y1_in_circle!=-1){
					var repeated=false;
					var set=paper.getElementsByPoint(cX(x1_in_circle),cY(y1_in_circle)+1);
					set.forEach(function(e1){
						if(arr_element_coor[e1.id].type==TYPE_PIN_SUPPORT || arr_element_coor[e1.id].type==TYPE_ROLLER_SUPPORT){
							repeated=true;
							return false;
						}
					});
				
					if(repeated==false){
						remove_label();
						var x=cX(x1_in_circle);
						var y=cY(y1_in_circle);
						if(button_clicked==BUTTON_PIN_SUPPORT){
							var tri = paper.image(PIN_PIC_PATH, x-SUPPORT_TRI_WIDTH/2, y, SUPPORT_TRI_WIDTH, SUPPORT_TRI_HEIGHT);
							tri.attr(PIN_SUPPORT_STYLE);
							current_support_id=tri.id;
							arr_pin_support.push(tri.id);
							var current_pin_support_coor=new coor(TYPE_PIN_SUPPORT,cX(x1_in_circle),cY(y1_in_circle));
							arr_element_coor[current_support_id]=current_pin_support_coor;
						}
						else if(button_clicked==BUTTON_ROLLER_SUPPORT){
							var tri = paper.image(ROLLER_PIC_PATH, x-SUPPORT_TRI_WIDTH/2, y, SUPPORT_TRI_WIDTH, SUPPORT_TRI_HEIGHT);
							tri.attr(ROLLER_SUPPORT_STYLE);
							current_support_id=tri.id;
							arr_roller_support.push(tri.id);
							var current_roller_support_coor=new coor(TYPE_ROLLER_SUPPORT,cX(x1_in_circle),cY(y1_in_circle));
							arr_element_coor[current_support_id]=current_roller_support_coor;
						}
					}
				}
			}
			else if(button_clicked==BUTTON_LOAD){
				if((x1_in_circle!=-1 || y1_in_circle!=-1) && load_click_count==2){
					remove_label();
					load_click_count=2/load_click_count;
					var p1="M"+cX(x1)+","+cY(y1);
					var p2="H"+cX(x1+LOAD_LENGTH);
					var p3="L"+cX(x1+LOAD_LENGTH-LOAD_ARROW_LENGTH)+","+cY(y1-LOAD_ARROW_LENGTH);
					var p4="L"+cX(x1+LOAD_LENGTH)+","+cY(y1);
					var p5="L"+cX(x1+LOAD_LENGTH-LOAD_ARROW_LENGTH)+","+cY(y1+LOAD_ARROW_LENGTH);
					var line=paper.path(p1+p2+p3+p4+p5);
					line.attr(LOAD_TEMP_STYLE);
					current_load_id=line.id;
				}
				else if(load_click_count==1){
					load_click_count=2/load_click_count;
					paper.getById(current_load_id).attr(LOAD_STYLE);
					var current_load_coor=new coor(TYPE_LOAD,cX(x1),cY(y1),load_angle, load_mag);
					arr_element_coor[current_load_id]=current_load_coor;
					arr_load.push(current_load_id);
				}
			}
			else if(button_clicked==BUTTON_MEMBER){
				remove_label();
				click_count=2/click_count;
				var rect_length=1;
				
				if(click_count==1){
					var r=paper.rect(cX(x1),(cY(y1)-MEMBER_RECT_THICK/2), rect_length, MEMBER_RECT_THICK).attr(MEMBER_RECT_TEMP_STYLE);
					var c1=paper.circle(cX(x1),cY(y1),MEMBER_CIRCLE_R).attr(MEMBER_CIRCLE_TEMP_STYLE);
	
					var current_c1_coor=new coor(TYPE_CIRCLE,cX(x1),cY(y1));
					arr_element_coor[c1.id]=current_c1_coor;
					
					//***********Circle1 behaviou************************************************************
					c1.mouseover(function(){
						if(button_clicked==BUTTON_MEMBER || button_clicked==BUTTON_PIN_SUPPORT || button_clicked==BUTTON_ROLLER_SUPPORT || button_clicked==BUTTON_LOAD){
							c1.attr(MEMBER_CIRCLE_MOUSEOVER_STYLE);
							if(click_count==2){
								x1_in_circle=cXr(arr_element_coor[c1.id].x);
								y1_in_circle=cYr(arr_element_coor[c1.id].y);
							}
							else if(click_count==1){
								x2_in_circle=cXr(arr_element_coor[c1.id].x);
								y2_in_circle=cYr(arr_element_coor[c1.id].y);
							}
						}
					});
					c1.mouseout(function(){
						c1.attr(MEMBER_CIRCLE_STYLE);
						x1_in_circle=-1;	
						y1_in_circle=-1;
						x2_in_circle=-1;	
						y2_in_circle=-1;
					});
					//***************************************************************************************
					current_rect_id=r.id;
					current_c1_id=c1.id;
				}
				else if(click_count==2){
					if(x1!=x2 || y1!=y2){
						paper.getById(current_rect_id).attr(MEMBER_RECT_STYLE);
						paper.getById(current_c1_id).attr(MEMBER_CIRCLE_STYLE);
						var c2=paper.circle(cX(x2),cY(y2),MEMBER_CIRCLE_R).attr(MEMBER_CIRCLE_STYLE);
						
						var current_rect_coor=new coor(TYPE_MEMBER,cX(x1),cY(y1),cX(x2),cY(y2));
						var current_c2_coor=new coor(TYPE_CIRCLE,cX(x2),cY(y2));
						arr_element_coor[current_rect_id]=current_rect_coor;
						arr_element_coor[c2.id]=current_c2_coor;
						arr_member.push(current_rect_id);
						
						//*****************Circle2 behavior******************************************************************
						c2.mouseover(function(){
							if(button_clicked==BUTTON_MEMBER || button_clicked==BUTTON_PIN_SUPPORT || button_clicked==BUTTON_ROLLER_SUPPORT || button_clicked==BUTTON_LOAD){
								c2.attr(MEMBER_CIRCLE_MOUSEOVER_STYLE);
								if(click_count==2){
									x1_in_circle=cXr(arr_element_coor[c2.id].x);
									y1_in_circle=cYr(arr_element_coor[c2.id].y);
								}
								else if(click_count==1){
									x2_in_circle=cXr(arr_element_coor[c2.id].x);
									y2_in_circle=cYr(arr_element_coor[c2.id].y);
								}
							}
						});
						c2.mouseout(function(){
							c2.attr(MEMBER_CIRCLE_STYLE);
							x1_in_circle=-1;	
							y1_in_circle=-1;
							x2_in_circle=-1;	
							y2_in_circle=-1;
						});
						//****************************************************************************************************
					}
				}
			}
		}
		catch(err){
			alert("An error has occured. Click 'Ok' to continue."+'\n\n'+"Error Message: "+err.message);
		}
	});
	
	$('#canvas').mousemove(function(e1) {	
		try{
			if(button_clicked==BUTTON_PIN_SUPPORT || button_clicked==BUTTON_ROLLER_SUPPORT){
				$('input[name="x1"]').val(cX(x1));
				$('input[name="y1"]').val(cY(y1));
				
				if(x1_in_circle==-1 || y1_in_circle==-1){
					x1=e1.pageX;
					y1=e1.pageY;
					if(button_clicked==BUTTON_PIN_SUPPORT){
						paper.getById(temp_pin_support_id).transform("T"+(cX(x1-suppot_x_ini)-SUPPORT_TRI_WIDTH/2)+","+cY(y1-suppot_y_ini));
						paper.getById(temp_pin_support_id).attr(PIN_SUPPORT_TEMP_STYLE);
					}
					else{
						paper.getById(temp_roller_support_id).transform("T"+(cX(x1-suppot_x_ini)-SUPPORT_TRI_WIDTH/2)+","+cY(y1-suppot_y_ini));
						paper.getById(temp_roller_support_id).attr(ROLLER_SUPPORT_TEMP_STYLE);
					}
					
				}
				else{
					x1=x1_in_circle;
					y1=y1_in_circle;
					if(button_clicked==BUTTON_PIN_SUPPORT){
						paper.getById(temp_pin_support_id).transform("T"+(cX(x1-suppot_x_ini)-SUPPORT_TRI_WIDTH/2)+","+cY(y1-suppot_y_ini));
						paper.getById(temp_pin_support_id).attr(PIN_SUPPORT_STYLE);
					}
					else{
						paper.getById(temp_roller_support_id).transform("T"+(cX(x1-suppot_x_ini)-SUPPORT_TRI_WIDTH/2)+","+cY(y1-suppot_y_ini));
						paper.getById(temp_roller_support_id).attr(ROLLER_SUPPORT_STYLE);
					}
				}
			}
			else if(button_clicked==BUTTON_LOAD){
				$('input[name="x1"]').val(cX(x1));
				$('input[name="y1"]').val(cY(y1));
				if(load_click_count==2){
					if(x1_in_circle==-1 || y1_in_circle==-1){
						x1=e1.pageX;	//the actual start point relative to screen
						y1=e1.pageY;
					}
					else{	//if point at a circle, then use coor of the circle
						x1=x1_in_circle;
						y1=y1_in_circle;
					}
				}
				else if(load_click_count==1){
					x2=e1.pageX;
					y2=e1.pageY;
					if(shift_down==true){
						var rounded_angle=Math.round(Raphael.angle(x2,y2,x1,y1)/15)*15;
						x2=x1+LOAD_LENGTH*Math.cos(rounded_angle/180*Math.PI);
						y2=y1+LOAD_LENGTH*Math.sin(rounded_angle/180*Math.PI);
						var rotation_string="R"+rounded_angle+","+cX(x1)+","+cY(y1);
						paper.getById(current_load_id).transform(rotation_string);
					}
					else{
						var rotation_string="R"+Raphael.angle(x2,y2,x1,y1)+","+cX(x1)+","+cY(y1);
						paper.getById(current_load_id).transform(rotation_string);
					}
					$('input[name="magnitute"]').val(load_mag);
					$('input[name="angle"]').val(360-Raphael.angle(x2,y2,x1,y1));
					load_angle=360-Raphael.angle(x2,y2,x1,y1);
				}
				/**************functions for setting load******************************************************************/
				$('input[name="magnitute"]').change(function() {
					if(load_click_count==1){
						load_mag=$(this).val();
					}
				});
				$('input[name="angle"]').change(function() {
					if(load_click_count==1){
						load_angle=$(this).val();
						var angle=360-$(this).val();
						rotation_string="R"+angle+","+cX(x1)+","+cY(y1);
						paper.getById(current_load_id).transform(rotation_string);
					}
				});
				$('button[name="set_load"]').click(function(e) {
					e.preventDefault();
					if(load_click_count==1){
						$('#canvas').click();
					}
				});
				/************************************************************************************/
			}
			else if(button_clicked==BUTTON_MEMBER){
				$('input[name="x1"]').val(cX(x1));
				$('input[name="y1"]').val(cY(y1));
				if(click_count==1){
					if(x2_in_circle==-1 || y2_in_circle==-1){
						x2=e1.pageX;
						y2=e1.pageY;
					}
					else{	//if point at a circle, then use coor of the circle
						x2=x2_in_circle;
						y2=y2_in_circle;
					}
					
					var scale=Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2))-3;
					var scale_string="S"+scale+","+"1"+","+cX(x1)+","+cY(y1);
					if(shift_down==true){
						var rounded_angle=Math.round(Raphael.angle(x2,y2,x1,y1)/15)*15;
						x2=x1+scale*Math.cos(rounded_angle/180*Math.PI);
						y2=y1+scale*Math.sin(rounded_angle/180*Math.PI);
						var rotation_string="R"+rounded_angle+","+cX(x1)+","+cY(y1);
						paper.getById(current_rect_id).transform(rotation_string+scale_string);
					}
					else{
						var rotation_string="R"+Raphael.angle(x2,y2,x1,y1)+","+cX(x1)+","+cY(y1);
						paper.getById(current_rect_id).transform(rotation_string+scale_string);
					}
					
					/**************functions for setting members******************************************************************/
					$('input[name="length"]').change(function() {
						if(click_count==1){
							var angle=Raphael.angle(x2,y2,x1,y1);
							scale=$(this).val()/general_scale;
							x2=x1+scale*Math.cos(angle/180*Math.PI);
							y2=y1+scale*Math.sin(angle/180*Math.PI);
							scale_string="S"+scale+","+"1"+","+cX(x1)+","+cY(y1);
							rotation_string="R"+Raphael.angle(x2,y2,x1,y1)+","+cX(x1)+","+cY(y1);
							paper.getById(current_rect_id).transform(rotation_string+scale_string);
							$('input[name="x2"]').val(cX(x2));
							$('input[name="y2"]').val(cY(y2));
						}
					});
					$('input[name="angle"]').change(function() {
						if(click_count==1){
							var angle=360-$(this).val();
							rotation_string="R"+angle+","+cX(x1)+","+cY(y1);
							x2=x1+scale*Math.cos(angle/180*Math.PI);
							y2=y1+scale*Math.sin(angle/180*Math.PI);
							paper.getById(current_rect_id).transform(rotation_string+scale_string);
							$('input[name="x2"]').val(cX(x2));
							$('input[name="y2"]').val(cY(y2));
						}
					});
					$('button[name="set_member"]').click(function(e) {
						e.preventDefault();
						if(click_count==1){
							$('#canvas').click();
						}
					});
					/************************************************************************************/
					
					$('input[name="x2"]').val(cX(x2));
					$('input[name="y2"]').val(cY(y2));
					$('input[name="length"]').val(scale*general_scale);
					$('input[name="angle"]').val(360-Raphael.angle(x2,y2,x1,y1));
					
				}
				else if(click_count==2){
					if(x1_in_circle==-1 || y1_in_circle==-1){
						x1=e1.pageX;	//the actual start point of the member relative to screen
						y1=e1.pageY;
					}
					else{	//if point at a circle, then use coor of the circle
						x1=x1_in_circle;
						y1=y1_in_circle;
					}
				}
			}
		}
		catch(err){
			alert("An error has occured. Click 'Ok' to continue."+'\n\n'+"Error Message: "+err.message);
		}
	});
});