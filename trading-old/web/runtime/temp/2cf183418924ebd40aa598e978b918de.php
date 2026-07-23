<?php /*a:3:{s:63:"/www/wwwroot/djpqa.cn/application/index/view/user/recharge.html";i:1641399592;s:63:"/www/wwwroot/djpqa.cn/application/index/view/public/header.html";i:1688203607;s:63:"/www/wwwroot/djpqa.cn/application/index/view/public/footer.html";i:1688192629;}*/ ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title>-</title><style type="text/css">
        html {
            font-size: 35px;
        }
    </style><link rel="stylesheet" type="text/css" href="/static/wap/css/common.css"><script>//LA.init({id: "JSsCh8pz2CqOvtAi",ck: "JSsCh8pz2CqOvtAi"})</script><script type="text/javascript" src="/bignumber.min.js"></script></head><body><link rel="stylesheet" type="text/css" href="/static/wap/css/tipmask.css"><link rel="stylesheet" type="text/css" href="/static/wap/css/box_pay.css"><div id="app"><div class="box"><!----><div class="jun-content"><div class="t_box_pay"><div class="t_header"><span><img src="/static/wap/images/goback.png" alt="" onClick="javascript:history.back()"></span><span><i>充值</i></span></div><div class="t_con_pay"><div class="t_money"><i></i><label>温馨提示：点击收款账号和姓名可复制其内容</label></div><div class="payment"><ul><li class="repeat_active"><i></i><span>开户银行：<?php echo getInfo('pay_bank_type'); ?></span><i></i></li><li class="repeat_active"><i></i><span>开户网点：<?php echo getInfo('pay_bank_type'); ?></span><i></i></li><li class="repeat_active"><i></i><span>收款账号：<p style="display: inline-block;" id="card"><?php echo getInfo('pay_bank_account'); ?></p></span><i></i></li><li class="repeat_active"><i></i><span>收款姓名：<p style="display: inline-block;" id="name"><?php echo getInfo('pay_bank_name'); ?></p></span><i></i></li></ul></div><div class="t_money"><i></i><label>温馨提示：确认转账成功后再进行充值金额提交</label></div><div class="payment othermon"><ul><li><span style="color: #fff;margin-left: .2rem">充值金额：&nbsp;</span><input type="text" id="money" value="" style="padding-left:5px;background: #181f2f;color:#fff"></li><li><span style="color: #fff;margin-left: .2rem">存款姓名：&nbsp;</span><input type="text" id="truename" value="" style="padding-left:5px;background: #181f2f;color:#fff"></li><li><span style="color: #fff;margin-left: .2rem">转账附言：&nbsp;</span><input type="text" id="reason" value="" style="padding-left:5px;background: #181f2f;color:#fff"></li></ul></div ><div class="t_pay_btn"><button id="sub_btn" value="" type="button">充值</button></div></div></div></div><div class="footer"><div><a href="/index/index/home" class="t_span one"><i></i><span>首页</span></a></div><!--<div><a href="/index/user/recharge" class="t_span two"><i></i><span>充值</span></a></div>--><div><a href="/index/user/hold" class="t_span two"><i></i><span>持仓</span></a></div><div><a onclick="window.open('<?php echo getInfo('service'); ?>',);" class="t_span three"><i></i><span>客服</span></a></div><!--<div><a href="/index/user/yeb" class="t_span four"><i></i><span>利息宝</span></a></div>--><div><a href="/index/user/index" class="t_span five"><i></i><span>我的</span></a></div></div><script type="text/javascript" src="/static/wap/js/jquery-1.9.1.min.js"></script><script type="text/javascript">
				    $(function(){
				        var nav = "recharge";
				       
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
				</script></div></div><div class="tipMask hide"><div class="cont"><p class="title">温馨提示</p><p class="stitle contents"></p><div id="msgBtn"><div class="confirm guanbi">确定</div></div></div></div></body><script type="text/javascript" src="/static/theme/index/js/layer.js"></script><script type="text/javascript" src="/static/theme/index/js/clipboard.min.js"></script><script type="text/javascript">    var clipboard = new Clipboard('#card', {
        text: function() {
            return $('#card').text();
        }
    });
    if(Clipboard.isSupported()) {
        clipboard.on('success', function(e) {
            layer.msg('复制成功');
        });
        clipboard.on('error', function(e) {
            layer.msg('复制成功');
            console.log(e);
        });
    } else {
        layer.msg('您当前系统和浏览器内核不支持复制,请手动复制打开微信');
    }
    var clipboard2 = new Clipboard('#name', {
        text: function() {
            return $('#name').text();
        }
    });
    if(Clipboard.isSupported()) {
        clipboard2.on('success', function(e) {
            layer.msg('复制成功');
        });
        clipboard2.on('error', function(e) {
            layer.msg('复制成功');
            console.log(e);
        });
    } else {
        layer.msg('您当前系统和浏览器内核不支持复制,请手动复制打开微信');
    }

    $(function () {
        $("#sub_btn").on("click", function () {
            var truename = $("#truename").val();
            var reason = $("#reason").val();
            var money = parseFloat($("#money").val()).toFixed(2);
            var auth = parseInt("<?php echo htmlentities($user['auth']); ?>");

            if (isNaN(money)) {
                msg("错误", "充值金额有误！", 1);
                return false;
            }
            if (money < <?php echo htmlentities($min_recharge); ?>) {
                msg("错误", "最低充值金额<?php echo htmlentities($min_recharge); ?>元！", 1);
                return false;
            }
            
            if (truename.length < 2) {
                msg("错误", "请输入付款人姓名！", 1);
                return false;
            }
            var url = "/index/user/recharge";
            $.ajax({
                type : "POST",
                url : url,
                data: {money:money,type:'bank',truename:truename,reason:reason},
                dataType : "json",
                success : function(result){
                    if(result.code == 1){
                        msg("提示",result.info,2,"/index/user/recharge_record");
                    }else{
                        msg("提示",result.info,1);
                    }
                }
            });
        })
    })

    function msg(title, content, type, url) {
        $(".contents").html(content);
        if (type == 1) {
            var btn = '<div class="confirm guanbi" onclick="$(\'.tipMask\').hide();">确定</div>';
        }
        else {
            var btn = '<div class="confirm guanbi" onclick="window.location.href=\'' + url + '\'">确定</div>';
        }
        $("#msgBtn").html(btn);
        $(".tipMask").show();
    }
</script></html>