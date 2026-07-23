<?php

// +----------------------------------------------------------------------
// | ThinkAdmin
// +----------------------------------------------------------------------
// | 版权所有 2014~2019 广州楚才信息科技有限公司 [  ]
// +----------------------------------------------------------------------
// | 官方网站: 
// +----------------------------------------------------------------------
// | 开源协议 ( https://mit-license.org )
// +----------------------------------------------------------------------
// | gitee 代码仓库3：https://gitee.com/zoujingli/ThinkAdmin
// | github 代码仓库3：https://github.com/zoujingli/ThinkAdmin
// +----------------------------------------------------------------------

namespace app\akszadmin\controller;

use library\Controller;
use think\Db;

/**
 * 流水记录
 * Class Item
 * @package app\akszadmin\controller
 */
class Yuebao extends Controller
{
    /**
     * 绑定数据表
     * @var string
     */
 

    /**
     * 流水记录
     * @auth true
     * @menu true
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     * @throws \think\exception\PDOException
     */
    public function index()
    {
       //$list=Db::name('lc_yuebao')->where('id',">",0)->select();
       $query = $this->_query('lc_yuebao')->where("id > 0 and status < 5");
        $query->order('id desc')->page();
       //$this->assign('list',$list);
       $this->fetch();
		
    }
    
    /**
     * 删除记录
     * @auth true
     * @throws \think\Exception
     * @throws \think\exception\PDOException
     */
    public function lists()
    {
        $list=Db::name('lc_yuebao_lists')->where("status < 5")->order('id desc')->select();
        $lists=array();
        foreach($list as $x=>$v){
        	$v['start_time']=date('Y-m-d H:i:s',$v['start_time']);
        	$v['end_time']=date('Y-m-d H:i:s',$v['end_time']);
        	$lists[$x]=$v;
        }
        $counttotal=count($list);
        $counttotalmoney=Db::name('lc_yuebao_lists')->where("status = 1")->sum('money');
        $countdoing=Db::name('lc_yuebao_lists')->where("status = 1")->count();
        $countnosend=Db::name('lc_yuebao_lists')->where("status = 1")->sum('nowprofit');
        $countsended=Db::name('lc_yuebao_log')->where("status = 2")->sum('nowprofit');
        //$list=$lists;
        $this->assign('list',$lists);
        $this->assign('counttotal',$counttotal);
        $this->assign('counttotalmoney',round($counttotalmoney,4));
        $this->assign('countdoing',$countdoing);
        $this->assign('countnosend',round($countnosend,4));
        $this->assign('countsended',round($countsended,4));
        $query = $this->_query('lc_yuebao_lists')->where("status < 5");
        $query->order('id desc')->page();
        //var_dump($list);die;
       
        
       $this->fetch();
        //$this->fetch();
    }
    public function yebdel(){
    	if($_SESSION['fw']['user']['username']=="admin"){
    		Db::name('lc_yuebao')->where("id = ".$_GET['id'])->update(['status'=>9]);
    		return "OK";
    	}else{
    		return "false";
    	}
    
    }
    public function yebstop(){
    	if($_SESSION['fw']['user']['username']=="admin"){
    		$getstatus=Db::name('lc_yuebao')->where("id = ".$_GET['id'])->find();
    		if($getstatus['status']==0) Db::name('lc_yuebao')->where("id = ".$_GET['id'])->update(['status'=>1]);
    		if($getstatus['status']==1) Db::name('lc_yuebao')->where("id = ".$_GET['id'])->update(['status'=>0]);
    		//Db::name('lc_yuebao')->where("id = ".$_GET['id'])->update(['status'=>0]);
    		return "OK";
    	}else{
    		return "false";
    	}
    	
    }
    public function yebadd(){
    	if($_SESSION['fw']['user']['username']!="admin"){return "非法访问";exit;die;}
    	if(empty($_POST)){return "数据错误！";exit;die;}
    	$adddata=array(
    		'title'=>$_POST['title'],
    		'lily'=>$_POST['lily'],
    		'days'=>$_POST['days'],
    		'advise'=>0,
    		'lowmoney'=>$_POST['lowmoney'],
    		'stars'=>$_POST['stars'],
    		'addtime'=>time(),
    		'status'=>$_POST['status'],
    	);
    	$ok=Db::name('lc_yuebao')->insert($adddata);
    	return $ok==1?"OK":"false";die;
    }
     public function yebedit(){
    	if($_SESSION['fw']['user']['username']!="admin"){return "非法访问";exit;die;}
    	if(empty($_POST)){return "数据错误！";exit;die;}
    	$adddata=array(
    		'title'=>$_POST['title'],
    		'lily'=>$_POST['lily'],
    		'days'=>$_POST['days'],
    		'advise'=>0,
    		'lowmoney'=>$_POST['lowmoney'],
    		'stars'=>$_POST['stars'],
    		'addtime'=>time(),
    		'status'=>$_POST['status'],
    	);
    	$ok=Db::name('lc_yuebao')->where('id = '.$_POST['yebid'])->update($adddata);
    	return $ok;die;
    }
    public function yebgetbyid(){
    	$res=Db::name('lc_yuebao')->where('id = '.$_GET['id'])->find();
    	return $res;
    }
    
    public function listclear(){
    	if($_SESSION['fw']['user']['username']!="admin"){return "非法访问";exit;die;}
    	if(empty($_POST)){return "数据错误！";exit;die;}
    	
	    $getlistinfo=Db::table('lc_yuebao_lists')->where('id='.$_POST['id'])->find();
	    if($getlistinfo['status']!=1 or empty($getlistinfo)){return "操作失败：订单无法操作！";die;}
	    
	    $getuserinfo=Db::table('lc_user')->where('id='.$getlistinfo['uid'])->find();
	    if(!empty($getuserinfo)){
	    	Db::table('lc_yuebao_lists')->where('id='.$_POST['id'])->update(['status'=>2,'end_time'=>time()]);
		    //记录日志！
		    unset($getlistinfo['id']);
		    $getlistinfo['status']=2;
		    $getlistinfo['end_time']=time();
		    $getlistinfo['balance']=$getuserinfo['money'];
		    $getlistinfo['closetime']=time();
		    $getlistinfo['remarks']="管理员".$_SESSION['fw']['user']['username']."人工结算";
		    Db::table('lc_yuebao_log')->insert($getlistinfo);
		    //更新用户余额
		    $newbalance=$getuserinfo['money']+$getlistinfo['nowprofit']+$getlistinfo['money'];
		    Db::table('lc_user')->where('id='.$getlistinfo['uid'])->update(['money'=>$newbalance]);
		    
		     //更新UC
		    $where['uid']=$getlistinfo['uid'];
		    $yebucinfo=Db::table('lc_yuebao_uc')->where($where)->find();
    		$newbalance=$yebucinfo['balance']-$getlistinfo['money'];
    		Db::table('lc_yuebao_uc')->where($where)->update(['balance'=>$newbalance]);
    		
    		//再做UCLOG
	    	$yebuclog=array(
	    		'uid'=>$getlistinfo['uid'],
	    		'balance'=>$yebucinfo['balance'],
	    		'money'=>$getlistinfo['money'],
	    		'addtime'=>time(),
	    		'remarks'=>"用户购买理财方案：".$getlistinfo['title']
	    	);
	    	Db::table('lc_yuebao_uclog')->insert($yebuclog);
	
		    return "ok";die;
	    	
	    }else{
	    	return "操作失败：订单无法操作！";die;
	    }
	    
	    
	    //更新参保状态。
	    
    }
    
    public function listkeep(){
    	if($_SESSION['fw']['user']['username']!="admin"){return "非法访问";exit;die;}
    	if(empty($_POST)){return "数据错误！";exit;die;}
    	$getlistinfo=Db::table('lc_yuebao_lists')->where('id='.$_POST['id'])->find();
    	if($getlistinfo['status']==2){
    		$getlistinfo['start_time']=time();
    		$getlistinfo['end_time']=time()+$getlistinfo['days']*86400;
    		$getlistinfo['status']=1;
    		$getlistinfo['nowprofit']=0;
    	}elseif($getlistinfo['status']==1){
    		$getlistinfo['end_time']=$getlistinfo['end_time']+$getlistinfo['days']*86400;
    	}
    	unset($getlistinfo['id']);
    	Db::table('lc_yuebao_lists')->where('id='.$_POST['id'])->update($getlistinfo);
    	 return "操作成功";die;
    }
    public function listdel(){
    	if($_SESSION['fw']['user']['username']!="admin"){return "非法访问";exit;die;}
    	if(empty($_POST)){return "数据错误！";exit;die;}
    	Db::name('lc_yuebao')->where("id = ".$_GET['id'])->update(['status'=>9]);
    		return "OK";die;
    	
    }
}
