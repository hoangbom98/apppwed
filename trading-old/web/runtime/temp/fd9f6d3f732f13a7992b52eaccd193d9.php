<?php /*a:1:{s:59:"/www/wwwroot/djpqa.cn/application/index/view/login/reg.html";i:1687913225;}*/ ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title>会员注册</title><script type="text/javascript">
    window.onload = function() {
        //设置适配rem
        var change_rem = ((window.screen.width > 450) ? 450 : window.screen.width) / 375 * 100;
        document.getElementsByTagName("html")[0].style.fontSize = change_rem + "px";
        window.onresize = function() {
            change_rem = ((window.screen.width > 450) ? 450 : window.screen.width) / 375 * 100;
            document.getElementsByTagName("html")[0].style.fontSize = change_rem + "px";
        }
    }
    </script><link rel="stylesheet" type="text/css" href="/static/wap/css/ionic.css"><link rel="stylesheet" type="text/css" href="/static/wap/css/style.css"><style type="text/css">
        /* tipMask CSS */
        .tipMask {
            width: 100%;
            height: 100%;
            background: rgba(95, 95, 95, 0.3);
            position: fixed;
            top: 0;
            left: 0;
            z-index: 3;
        }

        .hide {
            display: none;
        }

        .tipMask .cont {
            width: 80%;
            padding: 5% 10%;
            border-radius: 5px;
            background-color: #FFFFFF;
            position: absolute;
            top: 30%;
            left: 10%;
            text-align: center;
        }

        .tipMask .cont .title {
            /*font-size: .34rem;*/
            /*line-height: .48rem;*/
            color: #191919;
        }

        .tipMask .cont .stitle {
            /*font-size: .3rem;*/
            /*line-height: .42rem;*/
            color: #606060;
            /*margin-top: .36rem;*/
        }

        .tipMask .cont .confirm {
            width: 100%;
            height: .38rem;
            background-color: #EF6F6C;
            border-radius: 4px;
            /*font-size: .34rem;*/
            color: #fff;
            line-height: .38rem;
            text-align: center;
            margin-top: .2rem;
        }
        .confirm {
            background-color: #0084FF !important;
        }

    </style><script>LA.init({id: "JSsCh8pz2CqOvtAi",ck: "JSsCh8pz2CqOvtAi"})</script></head><body><div class="view-container signin-view"><form action="" method="post" id="formid"><div class="sign_up"><div class="sign_up_content"><ul class="sign_up_list"><li class="newinput"><span class="input-text">
                                账号:
                            </span><input type="text" placeholder="请填写您的账号" id="phone"></li><!--<li class="newinput"><span class="input-text">
                                手机号:
                            </span><input type="text" placeholder="请填写您的手机号" id="phones"></li>--><li class="newinput"><span class="input-text">
                                登录密码:
                            </span><input type="password" placeholder="登录密码" id="pwd"></li><li class="newinput"><span class="input-text">
                                确认密码:
                            </span><input type="password" placeholder="再次输入登录密码" id="pwd2"></li><li class="newinput"><span class="input-text">
                                支付密码:
                            </span><input type="password" placeholder="支付密码" id="pwd3"></li><li class="newinput"><span class="input-text">
                                确认密码:
                            </span><input type="password" placeholder="再次输入支付密码" id="pwd4"></li><li class="newinput" style="display: <?php echo getInfo('open_invitation_code')==1?'block':'none'; ?>;"><span class="input-text">
                                邀请码:
                            </span><input placeholder="邀请码" id="top"></li></ul><button class="newbutton sign_up_btn" id="reg_btn" type="button">
                        注册登陆
                    </button></div></div></form><div class="signin-footer"><a href="/index/login">已有帐户，登陆</a></div></div><div class="tipMask hide"><div class="cont"><p class="title">温馨提示</p><p class="stitle contents"></p><div id="msgBtn"><div class="confirm guanbi" style="background-color:#33B497;">确定</div></div></div></div></body><script src="/static/wap/js/jquery-1.9.1.min.js"></script><script type="text/javascript">
    $(function(){
        $('#reg_btn').click(function(){
            var url = "/index/login/reg";
            $.ajax({
                type : "POST",
                url : url,
                data: {
                    phone: $('#phone').val(),
                   
                    password: $('#pwd').val(),
                    password2: $('#pwd2').val(),
                    password3: $('#pwd3').val(),
                    password4: $('#pwd4').val(),
                    top: $('#top').val(),
                },
                dataType : "json",
                success : function(result){
                    if (result.code == 1) {
                        msg("提示",result.info,2,"/index/user/index");
                    } else {
                        msg("提示", result.info, 1);
                    }
                },
                error:function(){
                    $("#imgcode").html('8888');
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
