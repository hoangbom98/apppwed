<?php /*a:3:{s:66:"/www/wwwroot/djpqa.cn/application/index/view/user/set_account.html";i:1619939640;s:63:"/www/wwwroot/djpqa.cn/application/index/view/public/header.html";i:1688203607;s:63:"/www/wwwroot/djpqa.cn/application/index/view/public/footer.html";i:1688192629;}*/ ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title>账户安全</title><style type="text/css">
        html {
            font-size: 35px;
        }
    </style><link rel="stylesheet" type="text/css" href="/static/wap/css/common.css"><script>//LA.init({id: "JSsCh8pz2CqOvtAi",ck: "JSsCh8pz2CqOvtAi"})</script><script type="text/javascript" src="/bignumber.min.js"></script></head><body><link rel="stylesheet" type="text/css" href="/static/wap/css/box_pay.css"><div id="app"><div class="box"><div class="jun-content"><div class="f_box_bank"><div class="t_header"><span><img src="/static/wap/images/goback.png" alt="" onClick="javascript:history.back()"></span><span><i>账户安全</i></span></div><div class="f_content"><ul class="list"><li class="item"><span>用户名</span><span class="right"><?php echo htmlentities($user['phone']); ?></span></li><li class="item"><a href="/index/user/pwd_login"><span>修改登录密码</span><i class="iconfont icon-arrow-right"></i></a></li><li class="item"><a href="/index/user/pwd_pay"><span>修改支付密码</span><i class="iconfont icon-arrow-right"></i></a></li></ul></div></div></div><div class="footer"><div><a href="/index/index/home" class="t_span one"><i></i><span>首页</span></a></div><!--<div><a href="/index/user/recharge" class="t_span two"><i></i><span>充值</span></a></div>--><div><a href="/index/user/hold" class="t_span two"><i></i><span>持仓</span></a></div><div><a onclick="window.open('<?php echo getInfo('service'); ?>',);" class="t_span three"><i></i><span>客服</span></a></div><!--<div><a href="/index/user/yeb" class="t_span four"><i></i><span>利息宝</span></a></div>--><div><a href="/index/user/index" class="t_span five"><i></i><span>我的</span></a></div></div><script type="text/javascript" src="/static/wap/js/jquery-1.9.1.min.js"></script><script type="text/javascript">
				    $(function(){
				        var nav = "user";
				       
				        if(nav == "index"){
				            $(".one").addClass("router-link-exact-active");
				        }
				        /*if(nav == "recharge"){
				            $(".two").addClass("router-link-exact-active");
				        }*/
				        if(nav == "hold"){
				            $(".two").addClass("router-link-exact-active");
				        }
				        /*if(nav == "yeb"){
				            $(".four").addClass("router-link-exact-active");
				        }*/
				        if(nav == "user"){
				            $(".five").addClass("router-link-exact-active");
				        }
				    })
				</script></div></div></body></html>