<?php /*a:1:{s:70:"/www/wwwroot/cs.shangxiang.vip/application/index/view/index/goods.html";i:1707178556;}*/ ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title><?php echo htmlentities($info['title']); ?></title><link rel="stylesheet" type="text/css" href="/static/newstyle/css/common.css"><link rel="stylesheet" type="text/css" href="/static/newstyle/css/hangqing.css"><style type="text/css" media="all">
            #inputmoney {
                box-sizing: border-box;
                outline: none;
                width: 6rem;
                height: 2rem;
                border: 1px solid rgba(255, 255, 255, 0.09);
                background: #1E282E;
                border-radius: 16px;
                color: #fff;
                padding: 0 10px;
                text-align: center;
                font-size: 14px;
            }
        </style></head><body><div class="app"><div class="header"><div><img onclick="javascript:window.location.href='/index/index/home'" src="/static/newstyle/img/back.png" alt=""><span style="margin-left: 1rem"><?php echo htmlentities($info['title']); ?></span></div><!--  <div><span class="trade-chart-type stock active" onclick="change_chart_type('stock')">K线</span><span class="trade-chart-type line" onclick="change_chart_type('line')">波动</span></div>--></div><div class="infobox"><div class="left"><p id="jk"><?php echo htmlentities($info['Price']); ?></p><p id="rate" colse="<?php echo htmlentities($info['Close']); ?>">0.0%</p></div><!--  <div class="right"><div class="row"><div class="text"><span>高</span><span>42432.72</span></div><div class="text"><span>开</span><span>42432.72</span></div></div><div class="row"><div class="text"><span>低</span><span>42432.71</span></div><div class="text"><span>收</span><span>42432.71</span></div></div></div>--></div></div><div class="kbox"><div class="times"><div class="trade-chart-period active" data="1M" onclick="change_chart_period('1M')">
                    1M <span class="line"></span></div><div class="trade-chart-period" data="5M" onclick="change_chart_period('5M')">
                    5M <span class="line"></span></div><div class="trade-chart-period" data="15M" onclick="change_chart_period('15M')">
                    15M <span class="line"></span></div><div class="trade-chart-period" data="30M" onclick="change_chart_period('30M')">
                    30M <span class="line"></span></div><div class="trade-chart-period" data="1H" onclick="change_chart_period('1H')">
                    1H <span class="line"></span></div><div class="trade-chart-period" data="1D" onclick="change_chart_period('1D')">
                    1D <span class="line"></span></div></div><div class="tips" id="tips1"><i>Time:</i><span class="a">8:37:00 </span><span class="b">1299.905</span><span class="c">1300.42</span><span class="d">1288.55</span><span class="e">1300.42</span></div><div id="ecKx"></div><div class="tips" id="tips2"><i>DIFF:</i><span class="a">0</span><span class="b">
                    DEA:<i>0.0</i></span><span class="c">
                    MACD:<i>0.0</i></span></div><div class="btns"><div class="btn1" onclick="toggle_order_confirm_panel('lookup')">买涨</div><div class="btn2" onclick="toggle_order_confirm_panel('lookdown')">买跌</div></div></div><!-- 弹出层 --><div class="mark"><div onclick="toggle_order_close_panel()" style="position: absolute;width: 100%;right: 0;height: 100%;z-index: 1;"></div><div class="mbox" style="z-index:9"><div class="mtitle"><div class="close" onclick="toggle_order_close_panel()"><img src="/static/newstyle/img/xjiantou.png" alt=""></div>
                    订单确认
                </div><div class="topbox"><div class="toptitle">时间和金钱</div><div class="times"><div><?php if($info['protime_1'] > 0): ?><span class="active" data-sen="<?php echo htmlentities($info['protime_1']*60); ?>" data-shouyi="<?php echo htmlentities($info['proscale_1']); ?>" data-kuishun="<?php echo htmlentities($info['lossrate_1']); ?>" data-limit=<?php echo intval($info['limit1']); ?>><p>结算时间</p><p><i><?php echo htmlentities($info['protime_1']*60); ?></i>
                                    秒
                                </p></span><?php endif; if($info['protime_2'] > 0): ?><span class="active" data-sen="<?php echo htmlentities($info['protime_2']*60); ?>" data-shouyi="<?php echo htmlentities($info['proscale_2']); ?>" data-kuishun="<?php echo htmlentities($info['lossrate_2']); ?>" data-limit=<?php echo intval($info['limit2']); ?>><p>结算时间</p><p><i><?php echo htmlentities($info['protime_2']*60); ?></i>
                                    秒
                                </p></span><?php endif; if($info['protime_3'] > 0): ?><span class="active" data-sen="<?php echo htmlentities($info['protime_3']*60); ?>" data-shouyi="<?php echo htmlentities($info['proscale_3']); ?>" data-kuishun="<?php echo htmlentities($info['lossrate_3']); ?>" data-limit=<?php echo intval($info['limit3']); ?>><p>结算时间</p><p><i><?php echo htmlentities($info['protime_3']*60); ?></i>
                                    秒
                                </p></span><?php endif; if($info['protime_4'] > 0): ?><span class="active" data-sen="<?php echo htmlentities($info['protime_4']*60); ?>" data-shouyi="<?php echo htmlentities($info['proscale_4']); ?>" data-kuishun="<?php echo htmlentities($info['lossrate_4']); ?>" data-limit=<?php echo intval($info['limit4']); ?>><p>结算时间</p><p><i><?php echo htmlentities($info['protime_4']*60); ?>"</i>
                                    秒
                                </p></span><?php endif; ?></div></div><div class="moneys"><div><?php if(is_array($order_price) || $order_price instanceof \think\Collection || $order_price instanceof \think\Paginator): $i = 0; $__LIST__ = $order_price;if( count($__LIST__)==0 ) : echo "" ;else: foreach($__LIST__ as $key=>$vo): $mod = ($i % 2 );++$i;?><span data-price="<?php echo htmlentities($vo); ?>"><?php echo htmlentities($vo); ?></span><?php endforeach; endif; else: echo "" ;endif; ?><!--<input type="text" id="inputmoney" placeholder="其它金额">--><label class="other-amount"><input type="number" id="inputmoney" placeholder="其它金额" ng-init="onfocus=false" ng-focus="onfocus==true" ng-model="order_params.other_amount" ng-keydown="min_money()" class="ng-pristine ng-untouched ng-valid ng-empty"></label></div></div></div><div class="mymoney"><span>余额：<?php echo htmlentities($user['money']); ?></span><span>手续费：<?php echo getinfo('order_charge'); ?></span></div><div class="mbody"><div class="info"><span><p>品种</p><p><?php echo htmlentities($info['title']); ?></p></span><span><p>方向</p><p class="order_type">买跌</p></span><span><p>现价</p><p class="fail"><?php echo htmlentities($info['Price']); ?></p></span><span><p>金额</p><p id="selectmoney">0</p></span></div><div class="tbtn" onclick="addorder()">确认下单</div><p class="yqsy">
                        预期收益：<i id="yqsy">0.0</i></p></div></div></div><script src="/static/newstyle/js/jquery-1.9.1.min.js"></script><script src="/static/newstyle/js/layer/layer.js"></script><script type="text/javascript" src="/static/newstyle/js/function.js"></script><script type="text/javascript" src="/static/newstyle/js/base64.js"></script><script type="text/javascript">
            var Base64 = new Base64();
        </script><script type="text/javascript" src="/static/newstyle/js/order.js"></script><script type="text/javascript" src="/static/newstyle/js/lodash.min.js"></script><script type="text/javascript" src="/static/newstyle/js/chardata.js?v=1"></script><!--<script type="text/javascript" src="/static/newstyle/js/echarts.js"></script>--><script type="text/javascript" src="https://fastly.jsdelivr.net/npm/echarts@5.4.0/dist/echarts.min.js"></script><script type="text/javascript" src="/static/newstyle/js/m.js"></script><script>
    var order_type = 0;
    var order_pid = <?php echo htmlentities($info['id']); ?>;
    var order_price = <?php echo htmlentities($order_price[0]); ?>;
    var order_sen = <?php echo htmlentities($info['protime_1']*60); ?>;
    var order_shouyi = <?php echo !empty($info['proscale_1']) ? htmlentities($info['proscale_1']) : 0; ?>;
    var order_kuishun = <?php echo !empty($info['lossrate_1']) ? htmlentities($info['lossrate_1']) : 0; ?>;
    var limit_p = <?php echo !empty($info['limit1']) ? htmlentities($info['limit1']) : 0; ?>;
    var newprice = <?php echo htmlentities($info['Price']); ?>;  //实时价格
    var rawData_data = [];
    var my_money = <?php echo htmlentities($user['money']); ?>;
    var order_min_price = <?php echo getinfo('order_min'); ?>;
    var order_max_price = <?php echo getinfo('order_max'); ?>;
        </script><script>
            setInterval('getdata(order_pid)', 1000);
            setInterval("window.location.reload();", 1000 * 60 * 5);
            $('.amount-box').eq(0).click();
            //时间段切换
            $(".times div").click(function() {
                $(this).addClass('active').siblings().removeClass('active')
            })
        </script></body></html>
