<?php /*a:2:{s:72:"/www/wwwroot/cs.shangxiang.vip/application/index/view/user/add_card.html";i:1707180850;s:72:"/www/wwwroot/cs.shangxiang.vip/application/index/view/public/header.html";i:1707161130;}*/ ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title>添加银行卡</title><style type="text/css">
        html {
            font-size: 35px;
        }
    </style><link rel="stylesheet" type="text/css" href="/static/newstyle/css/common.css"></head><body><link rel="stylesheet" type="text/css" href="/static/newstyle/css/bindbank.css"></head><body><div class="app"><div class="header"><img onclick="javascript:history.back()" src="/static/newstyle/img/back.png" alt=""><span>绑定银行卡</span><span></span></div><div class="inputbox"><input type="text" placeholder="姓名" name="name" id="name" value=""></div><div class="inputbox"><input type="text" placeholder="银行名称" name="bank" id="bank" value=""></div><!-- <div class="inputbox"><input type="text" placeholder="开户行" name="area" id="area" value=""></div>--><div class="inputbox"><input type="text" placeholder="银行卡号" name="account" id="account" value=""></div><!--   <div class="inputbox"><input type="text" placeholder="ที่อยู่ผู้รับเงิน" name="skrdz" id="skrdz" value=""></div> --><div class="inputbox"><input type="text" placeholder="银行代码" name="lydm" id="lydm" value=""></div><div class="btn" id="sub_btn"><span>绑定银行卡</span></div></div><script src="/static/newstyle/js/jquery-1.9.1.min.js"></script><script src="/static/newstyle/js/layer/layer.js"></script><script>
            $(function() {
                $("#sub_btn").on("click", function() {
                    var bank = $('#bank').val();
                    //  var area = $('#area').val();

                    //      var skrdz = $('#skrdz').val();
                    var lydm = $('#lydm').val();

                    var account = $('#account').val();
                    if (account.length < 10) {
                        layer.msg("请输入银行卡号");
                        return false;
                    }
                    var name = $('#name').val();
                    if (name.length < 2) {
                        layer.msg("请输入银行名称");
                        return false;
                    }
                    var url = "/index/user/add_card";
                    $.ajax({
                        type: "POST",
                        url: url,
                        data: {
                            'bank': bank,
                            'account': account,
                            'name': name,
                            'area': lydm
                        },
                        dataType: "json",
                        success: function(result) {
                            if (result.code == 1) {
                                layer.msg('成功', {
                                    time: 1000
                                }, function() {
                                    window.location.href = "/index/user/bank_card"
                                })
                            } else {
                                layer.msg(result.info);
                            }
                        }
                    });
                })
            })
        </script></body></html>
