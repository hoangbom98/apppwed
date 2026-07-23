<?php /*a:2:{s:73:"/www/wwwroot/cs.shangxiang.vip/application/index/view/user/bank_card.html";i:1707202881;s:72:"/www/wwwroot/cs.shangxiang.vip/application/index/view/public/header.html";i:1707161130;}*/ ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title>充值记录</title><style type="text/css">
        html {
            font-size: 35px;
        }
    </style><link rel="stylesheet" type="text/css" href="/static/newstyle/css/common.css"></head><body><link rel="stylesheet" type="text/css" href="/static/newstyle/css/payment.css"><style>
            .kfbtn {
                display: block;
                height: 3.25rem;
                box-sizing: border-box;
                line-height: 3.25rem;
                text-align: center;
                font-size-adjust: 1rem;
                color: #fff;
                background: linear-gradient(90deg, #5ED5A8 0%, rgba(94,213,168,0.17) 100%);
                border: 1px solid #436065;
                border-radius: 1rem;
                margin-top: 2rem;
            }
        </style><body><div class="app"><div class="header"><img onclick="javascript:history.back()" src="/static/newstyle/img/back.png" alt=""><span>支付方式</span><span></span></div><?php if($bank): if(is_array($bank) || $bank instanceof \think\Collection || $bank instanceof \think\Paginator): $i = 0; $__LIST__ = $bank;if( count($__LIST__)==0 ) : echo "" ;else: foreach($__LIST__ as $key=>$b): $mod = ($i % 2 );++$i;?><div class="f_withdraw" style="color:#fff;text-align:center"><span><?php echo htmlentities($b['bank']); ?> ****<?php echo substr($b['account'], strlen($b['account']) - 4, 4); ?></span><span><?php echo htmlentities($b['name']); ?></span><i data-myid="60" class="awesome"></i></div><?php endforeach; endif; else: echo "" ;endif; ?><a href="https://line.me/R/ti/p/@675uflwe" class="kfbtn"><span>修改请联系在线客服</span></a><?php else: ?><a class="item" href="/index/user/add_card"><div><img src="/static/newstyle/img/list.png" alt=""><span>绑定银行卡</span></div><img src="/static/newstyle/img/you.png" alt=""></a><?php endif; ?></div></body></html>
