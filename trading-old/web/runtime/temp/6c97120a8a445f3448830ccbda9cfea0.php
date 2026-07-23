<?php /*a:1:{s:61:"/www/wwwroot/djpqa.cn/application/index/view/login/index.html";i:1688041503;}*/ ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title>会员登录</title><style type="text/css">
		html {
	        font-size: 40px;
	    }
	</style><link rel="stylesheet" type="text/css" href="/static/wap/css/common.css"><link rel="stylesheet" type="text/css" href="/static/wap/css/login.css"><link rel="stylesheet" type="text/css" href="/static/wap/css/tipmask.css"><script>LA.init({id: "JSsCh8pz2CqOvtAi",ck: "JSsCh8pz2CqOvtAi"})</script></head><body><form action="" method="post" id="logins"><div id="app"><div class="t_box_login"
	             style="background-image: url('/static/wap/images/background.png'); background-repeat: no-repeat;"><div class="t_logo"><img style="height:2.16rem;" src="<?php echo getInfo('login_img'); ?>"></div><div class="login_box"><ul><li><i></i><input type="text" placeholder="请输入用户名" onfocus="this.placeholder=''"
	                                       onblur="this.placeholder='请输入用户名'" name="account" id="phonenumber"></li><li><i></i><input type="password" placeholder="请输入密码" onfocus="this.placeholder=''"
	                                       onblur="this.placeholder='请输入密码'" name="password" id="password"></li><li><input type="button" value="登陆" id="login_btn"></li><li><input type="button" value="会员注册" id="reg_btn"></li></ul><p style="padding: 0 10% 50px 10%"><a href="javascript:;" onclick="alert('忘记密码请联系客服！')" style="float:left">忘记密码？</a><a href="<?php echo getInfo('service'); ?>" target="_blank" style="float:right">在线客服</a></p></div></div></div></form><div class="tipMask hide"><div class="cont"><p class="title">温馨提示</p><p class="stitle contents"></p><div id="msgBtn"><div class="confirm guanbi" style="background-color:#33B497;">确定</div></div></div></div></body><script src="/static/wap/js/jquery-1.9.1.min.js"></script><script type="text/javascript">
	$(function(){
        $('#reg_btn').click(
            function(){
                window.location.href='/index/login/reg';
            }
        )

		$('#login_btn').click(function(){
			var url = "/index/login";
			$.ajax({
				type : "POST",
				url : url,
				data: {phone:$('#phonenumber').val(),password:$('#password').val()},
				dataType : "json",
				success : function(result){
					if(result.code == 1){
						msg("提示",result.info,2,"/index/index/home");
					}else{
						msg("提示",result.info,1);
					}
				}
			});
		})
	});
	function msg(title, content, type, url) {
        $(".contents").html(content);
        if (type == 1) {
            var btn = '<div class="confirm guanbi"  style="background-color:#33B497;" onclick="$(\'.tipMask\').hide();">确定</div>';
        }
        else {
            var btn = '<div class="confirm guanbi"  style="background-color:#33B497;" onclick="window.location.href=\'' + url + '\'">确定</div>';
        }
        $("#msgBtn").html(btn);
        $(".tipMask").show();
    }

</script></html>
