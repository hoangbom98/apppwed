<?php /*a:1:{s:77:"D:\phpstudy_pro\WWW\test.ymkuzhan.com\application\index\view\login\index.html";i:1707234597;}*/ ?>
<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title><?php echo htmlentities(app('lang')->get('dengru')); ?></title><link rel="stylesheet" type="text/css" href="/static/newstyle/css/common.css"><link rel="stylesheet" type="text/css" href="/static/newstyle/css/login.css"></head><body><div class="app"><div class="lange"><span onclick="changelang('list')"><?php echo htmlentities(app('lang')->get('Lang')); ?></span></div><div id="langlist"><span id="langcng" onclick="changelang('th')">ภาษาไทย</span><br><span id="langth" onclick="changelang('yn')">Việt Nam</span><br><span id="langen" onclick="changelang('en')">English</span><br><span id="langcng" onclick="changelang('hk')">繁体中文</span><br><span id="langcns" onclick="changelang('zh')">简体中文</span><br><span id="langth" onclick="changelang('jp')">日本语</span><br><span id="langth" onclick="changelang('yindi')">हिन्दी</span><br><span id="langth" onclick="changelang('kor')">한국어</span></div><div class="logo"><img src="/upload/b54c91f30f709f27/cfb483193429f2ec.png" alt="logo"></div><div class="feiji"><img src="/static/newstyle/img/huojian.png" alt="fenji"></div><div class="login_h1"><?php echo htmlentities(app('lang')->get('dengru')); ?></div><div class="login_h4"><?php echo htmlentities(app('lang')->get('wellcome')); ?></div><div class="login_input"><input type="text" placeholder="<?php echo htmlentities(app('lang')->get('account')); ?>" name="account" id="phonenumber"></div><div class="login_input"><input type="password" placeholder="<?php echo htmlentities(app('lang')->get('password')); ?>" name="password" id="password"></div><div class="login_btn" id="login_btn"><?php echo htmlentities(app('lang')->get('dengru')); ?></div><a href="/index/login/reg" class="login_btn2"><?php echo htmlentities(app('lang')->get('Openaccountimmediately')); ?></a><div class="forget"  ><a style="color:#fff;"  href="https://wwww.google.com"><?php echo htmlentities(app('lang')->get('wanjimima')); ?></a></div ></div><script src="/static/newstyle/js/jquery-1.9.1.min.js"></script><script src="/static/newstyle/js/layer/layer.js"></script><script>
            function changelang(t) {
                if (t == "list") {
                    $('#langlist').fadeToggle();
                    return;
                } else {
                    $.ajax({
                        type: 'get',
                        url: '/index/index/changelang?lang=' + t,
                        dataType: "json",
                        success: function(res) {
                            window.localStorage.setItem('lang', t);
                            var td = $('#lang' + t).text();
                            $('#langset').text(td);
                            window.location.reload();
                        }
                    })
                }
            }
            $(function() {
                $('#login_btn').click(function() {
                    var url = "/index/login";
                    $.ajax({
                        type: "POST",
                        url: url,
                        data: {
                            phone: $('#phonenumber').val(),
                            password: $('#password').val()
                        },
                        dataType: "json",
                        success: function(result) {
                            if (result.code == 1) {
                                layer.msg(result.info, function() {
                                    window.location.href = "/index/user/index"
                                });
                            } else {
                                layer.msg(result.info);
                            }
                        }
                    });
                })
            })
        </script></body></html>
