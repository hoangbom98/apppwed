<?php /*a:3:{s:59:"/www/wwwroot/djpqa.cn/application/index/view/user/cash.html";i:1641399845;s:63:"/www/wwwroot/djpqa.cn/application/index/view/public/header.html";i:1688203607;s:63:"/www/wwwroot/djpqa.cn/application/index/view/public/footer.html";i:1688192629;}*/ ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title>-</title><style type="text/css">
        html {
            font-size: 35px;
        }
    </style><link rel="stylesheet" type="text/css" href="/static/wap/css/common.css"><script>//LA.init({id: "JSsCh8pz2CqOvtAi",ck: "JSsCh8pz2CqOvtAi"})</script><script type="text/javascript" src="/bignumber.min.js"></script></head><body><link rel="stylesheet" type="text/css" href="/static/wap/css/tipmask.css"><link rel="stylesheet" type="text/css" href="/static/wap/css/box_pay.css"><style type="text/css">    span {
        display: inline-block;
    }
</style><div id="app"><div class="box"><!----><div class="jun-content"><div class="t_box_withdraw"><div class="t_header"><span><img src="/static/wap/images/goback.png" alt="" onClick="javascript:history.back()"></span><span><i>提现</i></span></div><div class="t_con_withdraw"><div><label for="username">用户余额</label><input type="text" id="username" disabled="disabled" value="<?php echo htmlentities($user['money']); ?>"><span class="r_span r_span1">√</span></div><div><label for="withdraw">提现金额</label><input type="number" placeholder="请输入提现金额" id="money" onfocus="this.placeholder=''" oninput="xxoopp()" onblur="this.placeholder='请输入提现金额'"></div><div><label for="withdraw">手续费</label><input type="number" disabled="true" placeholder="手续费" id="txsxf" onfocus="this.placeholder=''"></div><script>                                function xxoopp(){
                                    
                                    console.log($("#money").val());
                                    var sxf1 = new BigNumber(0.01);
                                    var sxf2 = new BigNumber(<?php echo htmlentities($txsxf); ?>);
                                    var sxf3 = new BigNumber(sxf1.times(sxf2));
                                    var sxf4 = sxf3.times($("#money").val());
                                     $("#txsxf").val(sxf4);
                                    // alert(123);
                                }
                            </script><div><label for="withdraw">提现密码</label><input type="password" placeholder="请输入提现密码" id="pwd" onfocus="this.placeholder=''" onblur="this.placeholder='请输入提现密码'"></div><div><label>银行卡号</label><div class="select"><?php if($bank): ?><select name="bank" id="bank" style="width: 100%;background: none;border: none;color: #fff;background: #111723;"><option value="<?php echo htmlentities($bank['id']); ?>"><?php echo htmlentities($bank['bank']); ?> ****<?php echo substr($bank['account'], strlen($bank['account']) - 4, 4); ?></option></select><?php else: ?><p style="line-height:30px;color:#fff;margin-top:6px;"><input type="hidden" name="bank" id="bank" value="0"><a href="/index/user/add_card" style="color:green">绑定银行卡</a></p><?php endif; ?></div></div><span class="notice"><p>提示：</p><p>1.提现限制：<?php echo htmlentities($cash_min); ?> - <?php echo htmlentities($cash_max); ?></p><p style="color:red;">2.提现时间：<?php echo htmlentities($cash_start); ?> - <?php echo htmlentities($cash_end); ?></p><p>3.若忘记提款密码，请<a target="_blank" href="<?php echo getInfo('service'); ?>" style="color:red;">点击找回</a></p></span><?php if($bank): ?><div class="t_withdraw_btn"><button id="sub_btn" type="button">确认提交</button></div><?php else: ?><div class="t_withdraw_btn"><button id="sdtn" type="button">立即去绑定银行卡</button></div><?php endif; ?></div></div></div><div class="footer"><div><a href="/index/index/home" class="t_span one"><i></i><span>首页</span></a></div><!--<div><a href="/index/user/recharge" class="t_span two"><i></i><span>充值</span></a></div>--><div><a href="/index/user/hold" class="t_span two"><i></i><span>持仓</span></a></div><div><a onclick="window.open('<?php echo getInfo('service'); ?>',);" class="t_span three"><i></i><span>客服</span></a></div><!--<div><a href="/index/user/yeb" class="t_span four"><i></i><span>利息宝</span></a></div>--><div><a href="/index/user/index" class="t_span five"><i></i><span>我的</span></a></div></div><script type="text/javascript" src="/static/wap/js/jquery-1.9.1.min.js"></script><script type="text/javascript">
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
	    $("#sdtn").click(function(){
		   var ulrs="/index/user/add_card";
		   window.location.href =ulrs;
		});
        $('#withdraw').on('blur',function(){
            var withdraw = parseFloat($(this).val());
            var reg_par = (withdraw * 0/100).toFixed(2);
            $('#reg_par').val(reg_par>=0?reg_par:0);
        });
        $("#sub_btn").on("click", function () {
            var bank = $('#bank').val();
            var pwd = $("#pwd").val();
            var money = $("#money").val();
            if (money < <?php echo htmlentities($cash_min); ?>) {
                msg("错误", "最低提现金额为<?php echo htmlentities($cash_min); ?>元", 1);
                return false;
            }
            if (money ><?php echo htmlentities($cash_max); ?>) {
                msg("错误", "最高提现金额为<?php echo htmlentities($cash_max); ?>元", 1);
                return false;
            }
            if (pwd.length < 4) {
                msg("错误", "请输入交易密码", 1);
                return false;
            }
            var url = "/index/user/cash";
            $.ajax({
                type : "POST",
                url : url,
                data: {'money':money,'pwd':pwd,'bank':bank},
                dataType : "json",
                success : function(result){
                    if(result.code == 1){
                    	msg("提示",result.info,2,"/index/user/cash_record");
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