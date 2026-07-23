<?php /*a:3:{s:74:"/www/wwwroot/cs.shangxiang.vip/application/akszadmin/view/order/index.html";i:1641314963;s:67:"/www/wwwroot/cs.shangxiang.vip/application/akszadmin/view/main.html";i:1619939640;s:81:"/www/wwwroot/cs.shangxiang.vip/application/akszadmin/view/order/index_search.html";i:1636819005;}*/ ?>
<div class="layui-card layui-bg-gray"><?php if(!(empty($title) || (($title instanceof \think\Collection || $title instanceof \think\Paginator ) && $title->isEmpty()))): ?><div class="layui-card-header layui-anim layui-anim-fadein notselect"><span class="layui-icon layui-icon-next font-s10 color-desc margin-right-5"></span><?php echo htmlentities((isset($title) && ($title !== '')?$title:'')); ?><div class="pull-right"></div></div><?php endif; ?><div class="layui-card-body layui-anim layui-anim-upbit"><style>
	.layui-table td, .layui-table th{
		padding: 9px 0;
	}
 
	.color_red {
	 color:red;
	}
	.color_green{
	  color:green
	}
</style><div class="think-box-shadow"><fieldset><legend>条件搜索</legend><form class="layui-form layui-form-pane form-search" action="<?php echo request()->url(); ?>" onsubmit="return false" method="get" autocomplete="off"><div class="layui-form-item layui-inline"><label class="layui-form-label">用户名</label><div class="layui-input-inline"><input name="u_phone" value="<?php echo htmlentities((app('request')->get('u_phone') ?: '')); ?>" placeholder="请输入用户名" class="layui-input"></div></div><div class="layui-form-item layui-inline"><label class="layui-form-label">下单日期</label><div class="layui-input-inline"><input data-date-range name="i_time" value="<?php echo htmlentities((app('request')->get('i_time') ?: '')); ?>" placeholder="请选择下单日期" class="layui-input"></div></div><div class="layui-form-item layui-inline"><button class="layui-btn layui-btn-primary"><i class="layui-icon">&#xe615;</i> 搜 索</button></div><div class="layui-form-item layui-inline"><?php if($type==1): ?><a  data-dbclick  data-open='<?php echo url(ADMIN_MODULE."/order/index"); ?>?type=0'   style="margin-left:15px;"> 停止刷新</a><?php else: ?><a data-dbclick data-open='<?php echo url(ADMIN_MODULE."/order/index"); ?>?type=1'  style="margin-left:15px;">自动刷新</a><?php endif; ?></div></form><script>form.render()</script></fieldset><table class="layui-table margin-top-10" lay-skin="line"><?php if(!(empty($list) || (($list instanceof \think\Collection || $list instanceof \think\Paginator ) && $list->isEmpty()))): ?><thead><tr><th class='text-center nowrap'>订单编号</th><th class='text-center nowrap'>会员ID</th><th class="text-center nowrap">用户名</th><th class="text-center nowrap">姓名</th><th class="text-center nowrap">订单时间</th><th class="text-center nowrap">产品信息</th><th class="text-center nowrap">状态</th><th class="text-center nowrap">方向</th><th class="text-center nowrap">时间/点数</th><th class="text-center nowrap">建仓点位</th><th class="text-center nowrap">平仓点位</th><th class="text-center nowrap">委托余额</th><th class="text-center nowrap">无效委托余额</th><th class="text-center nowrap">有效委托余额</th><th class="text-center nowrap">实际盈亏</th><th class="text-center nowrap">买后余额</th><th class="text-center nowrap">单控操作</th><th class="text-center nowrap">详情</th></tr></thead><?php endif; ?><tbody><?php foreach($list as $key=>&$vo): $vo['b_name'] = db('lc_bank')->where('uid',$vo['uid'])->order('id','desc')->value('name'); ?><tr><td class='text-center nowrap'><?php echo htmlentities((isset($vo['id']) && ($vo['id'] !== '')?$vo['id']:'--')); ?></td><td class='text-center nowrap'><?php echo htmlentities((isset($vo['uid']) && ($vo['uid'] !== '')?$vo['uid']:'--')); ?></td><td class='text-center nowrap'><?php echo htmlentities((isset($vo['phone']) && ($vo['phone'] !== '')?$vo['phone']:'--')); ?></td><td class='text-center nowrap'><?php echo htmlentities((isset($vo['b_name']) && ($vo['b_name'] !== '')?$vo['b_name']:'--')); ?></td><td class='text-center nowrap'><a data-dbclick class="layui-btn layui-btn-sm" data-title="编辑下单时间" data-modal='<?php echo url(ADMIN_MODULE."/order/edits"); ?>?id=<?php echo htmlentities($vo['id']); ?>'><?php echo date('Y-m-d H:i:s',$vo['buytime']); ?></a></td><td class='text-center nowrap'><?php echo htmlentities((isset($vo['ptitle']) && ($vo['ptitle'] !== '')?$vo['ptitle']:'--')); ?></td><td class='text-center nowrap'><?php if($vo['ostaus']==1): ?>平仓<?php else: ?>建仓<?php endif; ?></td><?php if($vo['ostyle'] == 0): ?><td class="color_red text-center nowrap">买涨</td><?php elseif($vo['ostyle'] == 1): ?><td class="color_green text-center nowrap">买跌</td><?php endif; ?><td class='text-center nowrap'><?php echo htmlentities((isset($vo['endprofit']) && ($vo['endprofit'] !== '')?$vo['endprofit']:'--')); if($vo['eid']==1): ?>点<?php else: ?>秒<?php endif; ?></td><td class='text-center nowrap'><?php echo htmlentities((isset($vo['buyprice']) && ($vo['buyprice'] !== '')?$vo['buyprice']:'--')); ?></td><td class='text-center nowrap'><input type="text" oid="<?php echo htmlentities($vo['id']); ?>" value="<?php echo htmlentities($vo['sellprice']); ?>" class="select_gaipingcang layui-input" style="width: 100px;"></td><td class="color_red text-center nowrap">
                ¥<?php echo htmlentities($vo['fee']); ?></td><?php if($vo['ploss'] == 0): ?><td class="color_red text-center nowrap">
                ¥<?php echo htmlentities($vo['fee']); ?></td><?php else: ?><td class="color_red text-center nowrap">
                ¥0
            </td><?php endif; if($vo['ploss'] != 0): ?><td class="color_red text-center nowrap">
                ¥<?php echo htmlentities($vo['fee']); ?></td><?php else: ?><td class="color_red text-center nowrap">
                ¥0
            </td><?php endif; ?><td <?php if($vo['ploss'] > 0): ?> class="color_red text-center nowrap" <?php else: ?> class="color_green text-center nowrap" <?php endif; ?>>
                ¥<?php echo htmlentities($vo['ploss']); ?></td><td class="color_red text-center nowrap">
                ¥<?php echo htmlentities($vo['commission']); ?></td><td class="color_red text-center nowrap"><?php if($vo['ostaus']!=1): ?><select name="ostyle" id="" class="selectpicker select_change show-tick form-control"><option <?php if($vo['kong_type'] == 0): ?> selected="selected" <?php endif; ?> value="<?php echo htmlentities($vo['id']); ?>_0">默认</option><option <?php if($vo['kong_type'] == 1): ?> selected="selected" <?php endif; ?>  value="<?php echo htmlentities($vo['id']); ?>_1">盈</option><option <?php if($vo['kong_type'] == 2): ?> selected="selected" <?php endif; ?>  value="<?php echo htmlentities($vo['id']); ?>_2">亏</option><option <?php if($vo['kong_type'] == 3): ?> selected="selected" <?php endif; ?>  value="<?php echo htmlentities($vo['id']); ?>_3">全盈</option><option <?php if($vo['kong_type'] == 4): ?> selected="selected" <?php endif; ?>  value="<?php echo htmlentities($vo['id']); ?>_4">全亏</option></select><?php else: ?>已平仓<?php endif; ?></td><td class='text-center nowrap'><a data-dbclick class="layui-btn layui-btn-sm" data-title="查看详情" data-modal='<?php echo url(ADMIN_MODULE."/order/edit"); ?>?id=<?php echo htmlentities($vo['id']); ?>'>查 看</a><?php if($vo['ostaus']==1): ?><a class="layui-btn layui-btn-sm layui-btn-danger" data-confirm="确定要删除该订单吗?" data-action="<?php echo url(ADMIN_MODULE.'/order/remove'); ?>" data-value="id#<?php echo htmlentities($vo['id']); ?>">删 除</a><?php endif; ?></td></tr><?php endforeach; ?></tbody></table><?php if(empty($list) || (($list instanceof \think\Collection || $list instanceof \think\Paginator ) && $list->isEmpty())): ?><span class="notdata">没有记录哦</span><?php else: ?><?php echo (isset($pagehtml) && ($pagehtml !== '')?$pagehtml:''); ?><?php endif; ?></div></div><script>
$(".select_gaipingcang").change(function(){
    var oid = $(this).attr("oid");
    var sellprice = $(this).val();
    var postdata = 'id='+oid+"&sellprice="+sellprice;
    var posturl = "<?php echo url(ADMIN_MODULE.'/order/gaipingcang'); ?>";
    $.post(posturl,postdata,function(res){
        if(res.code == 1){
            layer.msg(res.info);
        }
    })
})  
$(".select_change").change(function(){
  var kong_id = $(this).val();
  if(kong_id){
    var kong_arr = kong_id.split('_');
  }
  var oid = kong_arr[0];
  var kong_type = kong_arr[1];
  var postdata = 'id='+oid+"&kong_type="+kong_type;
  var posturl = "<?php echo url(ADMIN_MODULE.'/order/dankong'); ?>";
  $.post(posturl,postdata,function(res){
     if(res.code == 1){
            layer.msg(res.info);
        }
  })
  
})

<?php if(app('request')->get('type')==1): ?>
	setInterval('shuaxin()', 5000);
<?php endif; ?>function shuaxin(){
	history.go(0)
}
</script></div>