<?php /*a:3:{s:63:"/www/wwwroot/djpqa.cn/application/index/view/user/add_card.html";i:1619939640;s:63:"/www/wwwroot/djpqa.cn/application/index/view/public/header.html";i:1688203607;s:63:"/www/wwwroot/djpqa.cn/application/index/view/public/footer.html";i:1688192629;}*/ ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title>添加银行卡</title><style type="text/css">
        html {
            font-size: 35px;
        }
    </style><link rel="stylesheet" type="text/css" href="/static/wap/css/common.css"><script>//LA.init({id: "JSsCh8pz2CqOvtAi",ck: "JSsCh8pz2CqOvtAi"})</script><script type="text/javascript" src="/bignumber.min.js"></script></head><body><link rel="stylesheet" type="text/css" href="/static/wap/css/tipmask.css"><link rel="stylesheet" type="text/css" href="/static/wap/css/box_pay.css"><div id="app"><div class="box"><div class="jun-content"><div class="f_box_addbank"><div class="t_header"><span><img src="/static/wap/images/goback.png" alt="" onClick="javascript:history.back()"></span><span><i>添加银行卡</i></span></div><div class="f_content"><ul><li><label>姓名</label><span><input type="text" name="name" id="name" value="" placeholder="输入姓名" onfocus="this.placeholder=''" onblur="this.placeholder='输入姓名'"></span></li><?php if(getInfo('bank') == 0): ?><li><label>银行名称</label><span><input type="text" name="bank" id="bank" value="" placeholder="输入银行名称" onfocus="this.placeholder=''" onblur="this.placeholder='输入银行名称'"></span></li><li><label>开户行</label><span><input type="text" name="area" id="area" value="" placeholder="输入银行卡开户行" onfocus="this.placeholder=''" onblur="this.placeholder='输入银行卡开户行'"></span></li><?php else: ?><input type="hidden" name="bank" id="bank" value=""><input type="hidden" name="area" id="area" value=""><?php endif; ?><li><label>银行卡号</label><span><input type="text" name="account" id="account" value="" placeholder="输入银行卡号" onfocus="this.placeholder=''" onblur="this.placeholder='输入银行卡号'"></span></li></ul><div class="sure"><button id="sub_btn" type="button" class="el-button el-button--danger">确认绑定 </button></div></div></div></div><div class="footer"><div><a href="/index/index/home" class="t_span one"><i></i><span>首页</span></a></div><!--<div><a href="/index/user/recharge" class="t_span two"><i></i><span>充值</span></a></div>--><div><a href="/index/user/hold" class="t_span two"><i></i><span>持仓</span></a></div><div><a onclick="window.open('<?php echo getInfo('service'); ?>',);" class="t_span three"><i></i><span>客服</span></a></div><!--<div><a href="/index/user/yeb" class="t_span four"><i></i><span>利息宝</span></a></div>--><div><a href="/index/user/index" class="t_span five"><i></i><span>我的</span></a></div></div><script type="text/javascript" src="/static/wap/js/jquery-1.9.1.min.js"></script><script type="text/javascript">
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
				</script></div></div><div class="tipMask hide"><div class="cont"><p class="title">温馨提示</p><p class="stitle contents"></p><div id="msgBtn"><div class="confirm guanbi">确定</div></div></div></div></body><script type="text/javascript" src="/static/theme/index/js/jquery.js"></script><script type="text/javascript">    $(function () {
        $("#sub_btn").on("click", function () {
            var bank = $('#bank').val();
            var area = $('#area').val();
            var account = $('#account').val();
            if (account.length < 10) {
                msg("错误", "输入银行卡号", 1);
                return false;
            }
            var name = $('#name').val();
            if (name.length < 2) {
                msg("错误", "输入姓名", 1);
                return false;
            }
            var url = "/index/user/add_card";
            $.ajax({
                type : "POST",
                url : url,
                data: {'bank':bank,'area':area,'account':account,'name':name},
                dataType : "json",
                success : function(result){
                    if(result.code == 1){
                        window.location.href = "/index/user/bank_card"
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