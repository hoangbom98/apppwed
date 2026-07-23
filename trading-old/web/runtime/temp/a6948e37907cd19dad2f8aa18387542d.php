<?php /*a:1:{s:68:"/www/wwwroot/cs.shangxiang.vip/application/index/view/login/reg.html";i:1707238919;}*/ ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title><?php echo htmlentities(app('lang')->get('zczh')); ?></title><link rel="stylesheet" type="text/css" href="/static/newstyle/css/common.css"><link rel="stylesheet" type="text/css" href="/static/newstyle/css/reg.css"></head><body><div class="app"><div class="close"><a href="/index/login/index"><img src="/static/newstyle/img/cha.png" alt="X"></a></div><div class="feiji"><img src="/static/newstyle/img/huojian.png" alt="fenji"></div><div class="login_h1"><?php echo htmlentities(app('lang')->get('zczh')); ?></div><div class="login_h4"><?php echo htmlentities(app('lang')->get('wellcome')); ?></div><div class="login_input"><input type="text" placeholder="<?php echo htmlentities(app('lang')->get('yonghuming')); ?>" id="phone"></div><div class="login_input"><input type="password" placeholder="<?php echo htmlentities(app('lang')->get('yonghumima')); ?>" id="pwd"></div><div class="login_input"><input type="password" placeholder="<?php echo htmlentities(app('lang')->get('quremima')); ?>" id="pwd2"></div><div class="login_input"><input type="password" placeholder="<?php echo htmlentities(app('lang')->get('zhifumima')); ?>" id="pwd3"></div><div class="login_input"><input type="password" placeholder="<?php echo htmlentities(app('lang')->get('qrzhifumima')); ?>" id="pwd4"></div><div class="login_input"><input type="password" placeholder="<?php echo htmlentities(app('lang')->get('youjyzm')); ?>" id="top" value=""></div><div class="login_btn" id="reg_btn"><?php echo htmlentities(app('lang')->get('zhuce')); ?></div><div class="forget"><?php echo htmlentities(app('lang')->get('wanjimima')); ?></div></div><script src="/static/newstyle/js/jquery-1.9.1.min.js"></script><script src="/static/newstyle/js/layer/layer.js"></script><script type="text/javascript">
            $(function() {
                $('#reg_btn').click(function() {
                    var url = "/index/login/reg";
                    $.ajax({
                        type: "POST",
                        url: url,
                        data: {
                            phone: $('#phone').val(),
                            password: $('#pwd').val(),
                            password2: $('#pwd2').val(),
                            password3: $('#pwd3').val(),
                            password4: $('#pwd4').val(),
                            top: $('#top').val(),
                        },
                        dataType: "text",
                        success: function(result) {
                            result = JSON.parse(result);
                            if (result.code == 1) {
                                layer.msg('success', function() {
                                    window.location.href = "/index/user/index"
                                });
                            } else {
                                layer.msg(result.info);
                            }
                        }
                    });
                })
            });
            function msg(title, content, type, url) {
                $(".contents").html(content);
                if (type == 1) {
                    var btn = '<div class="confirm guanbi"  style="background-color:#33B497;" onclick="$(\'.tipMask\').hide();">OK</div>';
                } else {
                    var btn = '<div class="confirm guanbi"  style="background-color:#33B497;" onclick="window.location.href=\'' + url + '\'">OK</div>';
                }
                $("#msgBtn").html(btn);
                $(".tipMask").show();
            }
        </script></body></html>
