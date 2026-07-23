<?php /*a:2:{s:75:"/www/wwwroot/cs.shangxiang.vip/application/akszadmin/view/yuebao/lists.html";i:1636815381;s:67:"/www/wwwroot/cs.shangxiang.vip/application/akszadmin/view/main.html";i:1619939640;}*/ ?>
<div class="layui-card layui-bg-gray"><?php if(!(empty($title) || (($title instanceof \think\Collection || $title instanceof \think\Paginator ) && $title->isEmpty()))): ?><div class="layui-card-header layui-anim layui-anim-fadein notselect"><span class="layui-icon layui-icon-next font-s10 color-desc margin-right-5"></span><?php echo htmlentities((isset($title) && ($title !== '')?$title:'')); ?><div class="pull-right"></div></div><?php endif; ?><div class="layui-card-body layui-anim layui-anim-upbit"><div class="layui-card-header layui-anim layui-anim-fadein notselect"><span class="layui-icon layui-icon-next font-s10 color-desc margin-right-5">余额宝--用户购买记录</span><div class="pull-right"></div></div><div class="think-box-shadow" style="text-align: center;height: 80px;line-height: 40px;"><div style="display: inline-block;width: 200px;border-radius: 5px;margin: 0 20px;"><span >进行中(记录数)</span><br><span style="font-size: 24px;"><?php echo htmlentities($countdoing); ?></span></div><div style="display: inline-block;width: 200px;border-radius: 5px;margin: 0 20px;"><span>资金池总额(元)</span><br><span style="font-size: 24px;"><?php echo htmlentities($counttotalmoney); ?></span></div><div style="display: inline-block;width: 200px;border-radius: 5px;margin: 0 20px;"><span>待分红金额(元)</span><br><span style="font-size: 24px;"><?php echo htmlentities($countnosend); ?></span></div><div style="display: inline-block;width: 200px;border-radius: 5px;margin: 0 20px;"><span>已分红金额(元)</span><br><span style="font-size: 24px;"><?php echo htmlentities($countsended); ?></span></div><div style="display: inline-block;width: 200px;border-radius: 5px;margin: 0 20px;"><span>总参加人次</span><br><span style="font-size: 24px;"><?php echo htmlentities($counttotal); ?></span></div></div><div class="think-box-shadow"><table class="layui-table margin-top-10" lay-skin="line"><?php if(!(empty($list) || (($list instanceof \think\Collection || $list instanceof \think\Paginator ) && $list->isEmpty()))): ?><thead><tr><th class='list-table-check-td think-checkbox'><label><input data-auto-none data-check-target='.list-check-box' type='checkbox'></label></th><th class='text-left nowrap'>序号</th><th class='text-left nowrap'>用户账号</th><th class='text-left nowrap'>余额宝名称</th><th class='text-left nowrap'>年化收益率(%)</th><th class='text-left nowrap'>锁定天数</th><th class='text-left nowrap'>金额(元)</th><th class='text-left nowrap'>当前收益(元)</th><th class='text-left nowrap'>预期收益(元)</th><th class='text-left nowrap'>开始时间</th><th class='text-left nowrap'>结束时间</th><th class='text-left nowrap'>状态</th><th class='text-left nowrap'></th></tr></thead><?php endif; ?><tbody><?php foreach($list as $key=>$vo): ?><tr data-dbclick ><td class='list-table-check-td think-checkbox'><label><input class="list-check-box" value='<?php echo htmlentities($vo['id']); ?>' type='checkbox'></label></td><td class='text-left nowrap'><?php echo htmlentities($vo['id']); ?></td><td class='text-left nowrap'><?php echo htmlentities($vo['username']); ?></td><td class='text-left nowrap'><?php echo htmlentities($vo['yebtitle']); ?></td><td class='text-left nowrap'><?php echo htmlentities($vo['lily']); ?></td><td class='text-left nowrap'><?php echo htmlentities($vo['days']); ?></td><td class='text-left nowrap'><?php echo htmlentities($vo['money']); ?></td><td class='text-left nowrap'><?php echo htmlentities($vo['nowprofit']); ?></td><td class='text-left nowrap'><?php echo htmlentities($vo['finishprofit']); ?></td><td class='text-left nowrap'><?php echo htmlentities($vo['start_time']); ?></td><td class='text-left nowrap'><?php echo htmlentities($vo['end_time']); ?></td><td class='text-left nowrap'><?php echo $vo['status']==0 ? "未生效" : ""; ?><?php echo $vo['status']==1 ? "进行中" : ""; ?><?php echo $vo['status']==2 ? "已结束" : ""; ?><?php echo $vo['status']==9 ? "已删除" : ""; ?></td><td class='text-left nowrap'><button onclick="listclear(<?php echo htmlentities($vo['id']); ?>)">结算</button> / <button onclick="listkeep(<?php echo htmlentities($vo['id']); ?>)">续期</button> / <button onclick="listdel(<?php echo htmlentities($vo['id']); ?>)">删除</button></td></tr><?php endforeach; ?></tbody></table><?php if(empty($list) || (($list instanceof \think\Collection || $list instanceof \think\Paginator ) && $list->isEmpty())): ?><span class="notdata">没有记录哦</span><?php else: ?><?php echo (isset($pagehtml) && ($pagehtml !== '')?$pagehtml:''); ?><?php endif; ?></div><script>
	function listclear(id){
		$.ajax({
			type:'post',
			url:'<?php echo ADMIN_MODULE; ?>/yuebao/listclear',
			data:{id:id},
			dataType: "json",
		    success: function (res) {
		    	console.log(res);
		    	layer.msg(res);
		    	setTimeout(location.reload(),1000);
		    }
			
		});
		
	}
	function listdel(id){
		$.ajax({
			type:'post',
			url:'<?php echo ADMIN_MODULE; ?>/yuebao/listdel',
			data:{id:id},
			dataType: "json",
		    success: function (res) {
		    	console.log(res);
		    	layer.msg(res);
		    	setTimeout(location.reload(),1000);
		    }
			
		});
		
	}
	function listkeep(id){
		$.ajax({
			type:'post',
			url:'<?php echo ADMIN_MODULE; ?>/yuebao/listkeep',
			data:{id:id},
			dataType: "json",
		    success: function (res) {
		    	console.log(res);
		    	layer.msg(res);
		    	setTimeout(location.reload(),1000);
		    }
			
		});
		
	}
</script></div></div>