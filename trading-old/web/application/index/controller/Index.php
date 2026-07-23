<?php

// +----------------------------------------------------------------------
// | ThinkAdmin
// +-------------s---------------------------------------------------------
// | 版权所有 2014~2023 广州楚才信息科技有限公司 [  ]
// +----------------------------------------------------------------------
// | 官方网站: 
// +----------------------------------------------------------------------
// | 开源协议 ( https://mit-license.org )
// +----------------------------------------------------------------------
// | gitee 代码仓库3：https://gitee.com/zoujingli/ThinkAdmin
// | github 代码仓库3：https://github.com/zoujingli/ThinkAdmin
// +----------------------------------------------------------------------

namespace app\index\controller;
use think\Db;

/**
 * 应用入口
 * Class Index
 * @package app\index\controller
 */
class Index extends Base
{

public function _initialize()
    {
        if(!(Cookie::has('think_var'))){
            $this->lang();
        }
        $this->assign('think_lang',Cookie::get('think_var'));
    }

public function  changelang()
    {
        $lang = input('?get.lang') ?  input('get.lang') : 'zh';
        switch ($lang) {
            //中文
            case 'zh':
                cookie('think_var', 'zh');
                break;
            //英文
            case 'en':
                cookie('think_var', 'en');
                break;
                        //香港
            case 'hk':
                cookie('think_var', 'hk');
                break;
                        //ภาษาไทย<
            case 'th':
                cookie('think_var', 'th');
                break;
                        //越南
            case 'yn':
                cookie('think_var', 'yn');
                break;
                        //日语
            case 'jp':
                cookie('think_var', 'jp');
                break;
                        //韩国
            case 'kor':
                cookie('think_var', 'kor');
                break; 
                //>हिन्दी
            case 'yindi':
                cookie('think_var', 'yindi');
                break;        
                
            default:
                cookie('think_var', 'zh');
                break;
        }
    }
    /**
     * @description：首页
     * @date: 2020/5/13 0013
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     * @throws \think\exception\PDOException
     */
    public function index()
    {
        $uid = $this->app->session->get('uid');
        if(!$uid) {
            if (true) { // true:开启线路;false:关闭线路
                return $this->fetch();
            }
            // $this->redirect('/index/login');
        }
        $this->redirect('/index/index/home');
    }


    /**
     * @description：未登录新闻页
     * @date: 2020/5/14 0014
     */
    public function news(){
        $this->fetch('new_index');
    }

    /**
     * Describe: 新闻页面
     * DateTime: 2020/5/14 1:16
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     * @throws \think\exception\PDOException
     */
    public function my_news(){
        $this->login = 0;
        if(!isLogin()) $this->login = 1;
        $this->conf = Db::name('LcReward')->get(1);
        $this->fetch('my_news');
    }

    /**
     * Describe: 新闻奖励
     * DateTime: 2020/5/14 1:27
     * @throws \think\Exception
     * @throws \think\Exception\DbException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\PDOException
     */
    public function news_reward(){
        if(isLogin()){
            $uid = $this->app->session->get('uid');
            $reward = Db::name('LcReward')->get(1);
            $start_time=strtotime(date("Y-m-d",time()));
            $end_time=$start_time+60*60*24;
            $reward['newsmoney'] = round($this->randFloat($reward['newsmoney'],$reward['newsmoneytwo']),2);
            $todaynum = Db::name('LcSeeLog')->where('uid=\'' . $uid . '\' and dateline > \'' . $start_time . '\' and dateline < \'' . $end_time . '\'')->count();
            if($todaynum < $reward['getnum']){
                addFinance($uid, $reward['newsmoney'],1, '浏览新闻，系统赠送' . $reward['newsmoney'] . '元');
                setNumber('LcUser', 'money', $reward['newsmoney'], 1, "id = $uid");
                setNumber('LcUser', 'income', $reward['newsmoney'], 1, "id = $uid");
                $add = array('uid' => $uid, 'dateline' => time(), 'money' => $reward['newsmoney']);
                Db::name('LcSeeLog')->insert($add);
                $morenum = $reward['getnum'] - $todaynum - 1;
                $this->success('奖励领取成功',['more'=>$morenum,'times'=>$reward['seetime'] * 60]);
            }else{
                $this->error('今日领取次数用尽');
            }
        }
    }

    private function randFloat($min=0, $max=1){
        return $min + mt_rand()/mt_getrandmax() * ($max-$min);
    }

    /**
     * @description：首页
     * @date: 2020/5/14 0014
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function home(){
        $uid = $this->app->session->get('uid');
        if(!$uid) $this->redirect('/index/login');
        $this->ater = Db::name('LcArticle')->where(['type'=>17,'show'=>1])->find();

        $this->banner = Db::name('LcSlide')->where(['show'=>1])->order("sort asc,id desc")->select();
        $allproducts= Db::name('LcProduct')->where(['isdelete'=>0,'iskq'=>1])->order("sort asc,id desc")->select();
        //判断是否开市
        $weekday=date("w");
        $newallproducts=array();
        if($weekday==0) $weekday=7;
        foreach($allproducts as $x=>$p){
            if(strpos($p['code'],"btc")!==false || strpos($p['code'],"usdt")!==false){
            $p['isclosetime']=0;
            $ttimes=$p['opentime_'.$weekday];
            if(empty($ttimes)){
                $p['isclosetime']=1;

                continue;
            };
            //var_dump($this->info['opentime_'.$weekday],$weekday);die;
            if(!empty($ttimes)){
                $optime=0;
                $ttimesarr=explode("|",$ttimes);
                foreach($ttimesarr as $t){
                    $t=explode('~',$t);
                    if(time()>strtotime(date('Y-m-d '.$t[0])) and time()<strtotime(date('Y-m-d '.$t[1]))) $optime=$optime+1;
                }
                if($optime==0)  $p['isclosetime']=1;
            }
            $newallproducts[$x]=$p;}
        }

        //var_dump($newallproducts);
        $conf = Db::name('LcInfo')->where(['id'=>1])->find();
        $zaixian = round(time()/800);
        
        $this->assign('zaixian',$zaixian);
        $this->assign('conf',$conf);
        
        foreach ($newallproducts as $k=>$val){
            $rate= $newallproducts[$k]['Price'] - $val['Open'];
            if($rate>0){
                $r = round(abs($rate)/$val['Open']*100,2);
            }else{
                $r = '-'.round(abs($rate)/$val['Open']*100,2);

            }
            
            $newallproducts[$k]['rate']  = $r;
        }
        
        $this->product =$newallproducts;
        $this->fetch();
    }

    /**
     * @description：项目列表
     * @date: 2020/5/14 0014
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function lists(){
        $uid = $this->app->session->get('uid');
        if(!$uid) $this->redirect('/index/login');
        $this->ljsy = Db::name('LcMallInvestList')->where(['status'=>1,'uid'=>$uid])->sum("money1");
        $now = date('Y-m-d H:i:s');
        $this->yxkj = Db::name('LcMallInvest')->where("time2 >= '$now' and uid = $uid")->count();
        $this->dqkj = Db::name('LcMallInvest')->where("time2 <= '$now' and uid = $uid")->count();
        $this->invest = Db::name('LcMallInvest')->where('uid', $uid)->where("time2 >= '$now'")->order("id desc")->select();
        $this->fetch();
    }

    public function normalfutures(){
        $uid = $this->app->session->get('uid');
        if(!$uid) $this->redirect('/index/login');
        $this->ljsy = Db::name('LcInvestList')->where(['status'=>1,'uid'=>$uid])->sum("money1");
        $now = date('Y-m-d H:i:s');
        $this->yxkj = Db::name('LcInvest')->where("time2 >= '$now'")->count();
        $this->dqkj = Db::name('LcInvest')->where("time2 <= '$now'")->count();
        $this->invest = Db::name('LcInvest')->where('uid', $uid)->where("time2 >= '$now'")->order("id desc")->select();
        $this->fetch();
    }

    public function expirefutures()
    {
        $uid = $this->app->session->get('uid');
        if(!$uid) $this->redirect('/index/login');
        $this->ljsy = Db::name('LcInvestList')->where(['status'=>1,'uid'=>$uid])->sum("money1");
        $now = date('Y-m-d H:i:s');
        $this->yxkj = Db::name('LcInvest')->where("time2 >= '$now'")->count();
        $this->dqkj = Db::name('LcInvest')->where("time2 <= '$now'")->count();
        $this->invest = Db::name('LcInvest')->where('uid', $uid)->where("time2 <= '$now'")->order("id desc")->select();
        $this->fetch();
    }

    /**
     * @description：项目列表
     * @date: 2020/5/14 0014
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function ex_lists(){
        $uid = $this->app->session->get('uid');
        if(!$uid) $this->redirect('/index/login');
        $this->ljsy = Db::name('LcMallInvestList')->where(['status'=>1,'uid'=>$uid])->sum("money1");
        $now = date('Y-m-d H:i:s');
        $this->yxkj = Db::name('LcMallInvest')->where("time2 >= '$now'")->count();
        $this->dqkj = Db::name('LcMallInvest')->where("time2 <= '$now'")->count();
        $this->invest = Db::name('LcMallInvest')->where('uid', $uid)->where("time2 <= '$now'")->order("id desc")->select();
        $this->fetch();
    }

    /**
     * @description：项目详情
     * @date: 2020/5/14 0014
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function item(){
        $uid = $this->app->session->get('uid');
        if(!$uid) $this->redirect('/index/login');
        $id = $this->app->request->param('id');
        if(!$id) msg('无效参数',2,'/index');
        $this->data = Db::name('LcItem')->where(['id'=>$id])->find();
        if(!$this->data) msg('无效项目',2,'/index');
        if (date('Y-m-d H:i:s') < $this->data['time'])  msg('项目暂未开始！',2,'/index');
        $this->fetch();
    }

    /**
     * @description：矿机详情
     * @date: 2020/5/14 0014
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function mall_detail(){
        $uid = $this->app->session->get('uid');
        if(!$uid) $this->redirect('/index/login');
        $id = $this->app->request->param('id');
        if(!$id) msg('无效参数',2,'/index');
        $this->data = Db::name('LcMall')->where(['id'=>$id])->find();
        if(!$this->data) msg('无效矿机',2,'/index');
        $this->fetch();
    }


    /**
     * @description：投资
     * @date: 2020/5/14 0014
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     * @throws \think\exception\PDOException
     */
    public function form(){
        $uid = $this->app->session->get('uid');
        if(!$uid) $this->redirect('/index/login');
        $id = $this->app->request->param('id');
        if(!$id) msg('无效参数',2,'/index');
        $this->data = Db::name('LcItem')->where(['id'=>$id])->find();
        if(!$this->data) msg('无效项目',2,'/index');
        if (date('Y-m-d H:i:s') < $this->data['time'])  msg('项目暂未开始！',2,'/index');
        if (getProjectPercent($this->data['id']) == 100) msg('项目已满，请选择其他项目', 2, '/index');
        $this->user = Db::name('LcUser')->find($uid);
        if($this->user['auth'] != 1) msg('请实名认证后再投资！', 2, '/index/User/certification');
        //抵用券
        $voucher_info = Db::name('LcVoucher')->where("uid = $uid AND status = 2")->order('money desc')->select();
        if(empty($voucher_info)){
            $this->voushow = 0;
            $this->vinfo = array();
        }else{
            $this->vinfo = $this->voucherinfo;
        }
        $count = Db::name('LcVoucher')->where('status = 1 and uid = '.$uid.' and xid = '.$id)->count();
        if($this->data['usevoucher'] <= $count){
            $this->voushow = 0;
            $this->usevounum = 0;
        }else{
            $this->voushow = 1;
            $this->usevounum = $this->data['usevoucher']-$count;
        }
        //检查等级
        $level = Db::name('LcItemClass')->alias('c')->field("c.id,m.value")->join("lc_user_member m","c.member_id = m.id")->where("c.id = {$this->data['class']}")->find();
        if($this->user['value'] < $level['value']) msg('您的等级不够', 2, '/index');
        if($this->app->request->isPost()){
            $param = $this->app->request->param();
//            $voucher = $param['voucher'];
            $voucher = 0;
            $money = $param['money'];
            if($voucher){
                $arrvid = explode(',',$voucher);
                $vouallmoney = 0;
                foreach ($arrvid as $k => $v) {
                    $voucherinfos = Db::name('LcVoucher')->where("vid = '$v'")->find();
                    if(empty($voucherinfos)){
                        msg('抵用券不存在', 2, '/index');
                    }
                    if($voucherinfos['status'] != 2){
                        msg('抵用券已使用', 2, '/index');
                    }
                    $vouallmoney = $vouallmoney + $voucherinfos['money'];
                }
                $count = $count + count($arrvid);
                if($count > $this->data['usevoucher']){
                    msg('最多使用'.$this->data['usevoucher'].'张投资抵用券', 2, '/index');
                }
                $money = $param['money'] - $vouallmoney;
                if($money < 0) $money = 0;
            }
            $my_count = Db::name('LcInvest')->where(['uid' =>$uid,'pid' =>$id])->count();
            if($this->data['num'] <= $my_count) msg('该项目每人限投' . $this->data['num'] . '次！', 2, '/index');
            if($this->user['password2'] != md5($param['pwd'])) msg('请输入正确的交易密码！', 2, '/index');
            if($this->user['money'] < $money) msg('余额不足，请充值后再进行投资！', 2,'/index');
            if ($this->data['max'] < $money) msg('投资金额大于项目最大投资额度！', 2,'/index');
            if (getProjectSurplus($this->data['id']) < $money) msg('投资金额大于项目剩余投资额度！', 2,'/index');
            if ($this->data['min'] > $money) msg('投资金额小于项目最小投资额度！', 2,'/index');
            addFinance($uid, $money, 2, '投资项目：' . $this->data['title'] . '，使用余额' . $money . '元');
            setNumber('LcUser', 'money', $money, 2, "id = $uid");
            setInvestReward_old($uid, $money);
            if($voucher){
                foreach ($arrvid as $k => $v) {
                    Db::name('LcVoucher')->where("vid = '{$v}'")->update(array('status' => 1,'xid'=>$id,'title'=>$this->data['title']));
                }
            }
            if(getInvestList($id, $money, $uid)) {
                if (0 < $this->data['red']) {
                    $multiple = floor($money / $this->data['min']) * $this->data['red'] ?: 0;

                    if (0 < $multiple) {
                        addFinance($uid, $multiple, 1, '投资送红包');
                        setNumber('LcUser', 'money', $multiple, 1, "id = $uid");
                    }
                }
                msg('投资成功！', 2, '/index/user/index');
            }
            msg('投资失败！', 2, '/index/user/index');
        }
        $this->fetch();
    }

    /**
     * Describe:
     * DateTime: 2021/1/14 1:38
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function mall_form(){
        $uid = $this->app->session->get('uid');
        if(!$uid) $this->redirect('/index/login');
        $id = $this->app->request->param('id');
        if(!$id) msg('无效参数',2,'/index');
        $this->data = Db::name('LcMall')->where(['id'=>$id])->find();
        if(!$this->data) msg('无效项目',2,'/index');
        if ($this->data['stock'] <= 0) msg('矿机已满，请选择其他矿机', 2, '/index');
        $this->user = Db::name('LcUser')->find($uid);
        if($this->user['auth'] != 1) msg('请实名认证后再投资！', 2, '/index/User/certification');
        if($this->app->request->isPost()){
            $param = $this->app->request->param();
            if($this->user['password2'] != md5($param['password'])) $this->error("请输入正确的交易密码");
            if($this->data['num'] < $param['buynum']||$param['buynum']<=0) $this->error("该矿机限购".$this->data['num']."份");
            $my_count = Db::name('LcMallInvest')->where(['uid' =>$uid,'pid' =>$id])->count();
            if($this->data['num'] <= $my_count) $this->error("该矿机限购".$this->data['num']."份");
            $money = $this->data['min']*$param['buynum'];
            if($this->user['money'] < $money) $this->error("余额不足，请充值后再进行投资！");
            if($this->data['stock'] <= 0 || $this->data['stock'] < $param['buynum']) $this->error("该矿机剩余不足");
            addFinance($uid, $money, 2, '租赁矿机：' . $this->data['title'] . '，缴纳保证金' . $money . '元');
            setNumber('LcUser', 'money', $money, 2, "id = $uid");
            if(getMallInvestList($id, $money, $uid,$param['tran_type'])) {
                $this->success("租赁成功");
            }
            $this->success("租赁失败");
        }
        $this->fetch();
    }

    /**
     * Describe:计算器
     * DateTime: 2020/5/14 20:52
     */
    public function calculator(){
        $this->fetch();
    }

    /**
     * Describe:关于我们
     * DateTime: 2020/5/14 21:02
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function about(){
        $this->abour_type = Db::name('lcArticleType')->order("sort asc,id desc")->select();
        $this->fetch();
    }

    /**
     * Describe:文章列表
     * DateTime: 2020/5/14 21:13
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function about_list(){
        $id = $this->app->request->param('id');
        if (empty($id)) msg('参数缺失！', 2, '/index');
        $this->count = Db::name('lcArticle')->where(['type'=>$id,'show'=>1])->count();
        if($this->count == 1){
            $this->article_id = Db::name('lcArticle')->where(['type'=>$id,'show'=>1])->value('id');
            $this->redirect('/index/index/about_details?id='.$this->article_id);
        }else{
            $this->type_name = Db::name('lcArticleType')->where(['id'=>$id])->value('name');
            $this->about = Db::name('lcArticle')->where(['type'=>$id,'show'=>1])->order("id desc")->select();
            $this->fetch();
        }
    }

    /**
     * Describe:文章详情
     * DateTime: 2020/5/14 21:25
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function about_details(){
        $id = $this->app->request->param('id');
        if (empty($id)) msg('参数缺失！', 2, '/index');
        $this->article = Db::name('lcArticle')->where(['id'=>$id,'show'=>1])->find();
        $this->fetch();
    }

    /**
     * Describe:抽奖
     * DateTime: 2020/5/14 23:45
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function prize(){
        $uid = $this->app->session->get('uid');
        if(!$uid) $this->redirect('/index/login');
        $this->data = Db::name("LcPrize")->find(1);
        $this->user = Db::name('LcUser')->find($uid);
        $this->count = $this->user['prize'] ?: 0;
        $prize_list = Db::name("LcPrizeList")->where("type != 0")->limit(10)->order("id desc")->select();
        foreach ($prize_list as $k=>&$v){
            $mobile=getUserPhone($v['uid']);
            $mobile=substr_replace($mobile, '****', 3, 4);
            if($v['type']==1){
                $v['msg']='恭喜 '.$mobile.' 的用户抽中 现金'.$v['name'];
            }else{
                $v['msg']='恭喜 '.$mobile.' 的用户抽中 '.$v['name'];
            }
        }
        $this->assign('prize_list', $prize_list);
        $this->fetch();
    }

    /**
     * Describe:开始抽奖
     * DateTime: 2020/5/14 23:06
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     * @throws \think\exception\PDOException
     */
    public function prize_start(){
        $res = $this->get_gift();
        $item = $res['id'] + 1;
        if (empty($item)) $this->error("参数缺失，请刷新后重试！");
        if(!isLogin()) $this->error("参数缺失，请刷新后重试！",'',2);
        $uid = $this->app->session->get('uid');
        $this->user = Db::name('LcUser')->find($uid);
        if ($this->user['prize'] <= 0) $this->error("抽奖次数不足，请投资后再进行抽奖！");
        $prize = Db::name("LcPrize")->find(1);
        $name = $prize['name' . $item] ?: '谢谢参与';
        $type = $prize['type' . $item] ?: '无';
        $reason = $prize['reason' . $item] ?: '继续投资，还有机会哟！';
        $money = $prize['money' . $item] ?: 0;
        if ($prize['endtime'] < date('Y-m-d H:i:s')) $this->error("活动已结束");
        $add_prize = array('uid' => $uid, 'item' => $item, 'name' => $name, 'type' => $type, 'money' => $money, 'time' => date('Y-m-d H:i:s'));
        Db::name("LcPrizeList")->insert($add_prize);
        if($prize['type'.$item] == 1){
            addFinance($uid, $money,1, '抽奖获得' . $money . '元现金红包');
            setNumber('LcUser', 'money', $money, 1, "id = $uid");
        }
        setNumber('LcUser', 'prize', 1, 2, "id = $uid");
        $this->success($reason,['item'=>$item]);
    }

    /**
     * Describe:抽奖记录
     * DateTime: 2020/5/14 23:14
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function prize_list(){
        $uid = $this->app->session->get('uid');
        if(!$uid) $this->redirect('/index/login');
        $this->prize = Db::name("LcPrizeList")->where("uid = $uid AND type <> 0")->order("id desc")->select();
        $this->fetch();
    }

    /**
     * Describe:积分商城
     * DateTime: 2020/5/14 23:48
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function shop(){
        $uid = $this->app->session->get('uid');
        if(!$uid) $this->redirect('/index/login');
        $this->shop = Db::name("LcShop")->where("num > 0")->order("sort asc,id desc")->select();
        $this->fetch();
    }

    /**
     * Describe:商品详情
     * DateTime: 2020/5/15 0:06
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function shop_details(){
        $uid = $this->app->session->get('uid');
        if(!$uid) $this->redirect('/index/login');
        $id = $this->app->request->param('id');
        if(!$id) msg('参数缺失！', 2, 'index/user/index');
        $this->goods = Db::name("LcShop")->where(['id'=>$id])->find();
        $integral = Db::name('LcUser')->where(['id'=>$uid])->value('integral');
        $this->count = $integral?:0;
        $this->fetch();
    }

    /**
     * Describe:积分兑换
     * DateTime: 2020/5/15 0:15
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function shop_exchange(){
        $uid = $this->app->session->get('uid');
        if(!$uid) $this->error("请先登录",'',2);
        $gid = $this->app->request->param('gid');
        if(!$gid) msg('参数缺失！', 2, 'index/user/index');
        $this->goods = Db::name("LcShop")->where(['id'=>$gid])->find();
        if(!$this->goods) msg('暂无该商品！', 2, 'index/user/index');
        $this->user = Db::name('LcUser')->find($uid);
        if ($this->user['integral'] < $this->goods['integral']) $this->error("积分不足，请投资后再进行兑换！");
        if ($this->goods['num'] <= 0) $this->error("商品数量不足，请兑换其他商品！");
        $add_order = array('uid' => $uid, 'gid' => $gid, 'goods' => $this->goods['title'], 'img' => $this->goods['img'], 'integral' => $this->goods['integral'], 'type' => $this->goods['type'], 'money' => $this->goods['money'], 'time' => date('Y-m-d H:i:s'));
        Db::name("LcShopOrder")->insert($add_order);
        setNumber('LcUser', 'integral', $this->goods['integral'], 2, "id = $uid");
        setNumber('LcShop', 'num', 1, 2, "id = $gid");
        if($this->goods['type'] == '1'){
            addFinance($uid, $this->goods['money'],1, '积分兑换获得' . $this->goods['money'] . '元现金红包');
            setNumber('LcUser', 'money', $this->goods['money'], 1, "id = $uid");
            $this->success($this->goods['money']."元现金下发到您的余额！");
        }
        $this->success("兑换成功，请联系客服邮寄！");
    }

    /**
     * Describe:兑换记录
     * DateTime: 2020/5/15 0:22
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function shop_order(){
        $uid = $this->app->session->get('uid');
        if(!$uid) $this->redirect('/index/login');
        $this->shop_order = Db::name("LcShopOrder")->where(['uid'=>$uid])->order("id desc")->select();
        $this->fetch();
    }

    /**
     * Describe:抽奖算法
     * DateTime: 2020/5/14 22:46
     * @return mixed
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    private function get_gift()
    {
        $data = Db::name("LcPrize")->find(1);
        $surplus = 100 - $data['odds1'] - $data['odds2'] - $data['odds3'] - $data['odds4'] - $data['odds5'];
        if (0 < $surplus) {
            $data['odds6'] = $surplus;
        }else {
            $data['odds6'] = 0;
        }
        //奖品数组
        $prize_arr = array(
            '0' => array('id' => 1, 'prize' => $data['name1'], 'v' => $data['odds1']),
            '1' => array('id' => 2, 'prize' => $data['name2'], 'v' => $data['odds2']),
            '2' => array('id' => 3, 'prize' => $data['name3'], 'v' => $data['odds3']),
            '3' => array('id' => 4, 'prize' => $data['name4'], 'v' => $data['odds4']),
            '4' => array('id' => 5, 'prize' => $data['name5'], 'v' => $data['odds5']),
            '5' => array('id' => 6, 'prize' => '谢谢参与', 'v' => $data['odds6']),
        );
        foreach ($prize_arr as $key => $val) {
            $arr[$val['id']] = $val['v'];
        }
        $rid = $this->get_rand($arr);
        $res['yes'] = $prize_arr[$rid - 1]['prize'];
        $res['id'] = $rid - 1;
        unset($prize_arr[$rid - 1]);
        shuffle($prize_arr);
        for ($i = 0; $i < count($prize_arr); $i++) {
            $pr[] = $prize_arr[$i]['prize'];
        }
        $res['no'] = $pr;
        if ($res['yes'] != '谢谢参与') {
            $result['status'] = 1;
            $result['name'] = $res['yes'];
            $result['id'] = $res['id'];
        } else {
            $result['status'] = -1;
            $result['msg'] = $res['yes'];
            $result['id'] = $res['id'];
        }
        return $result;
    }

    /**
     * Describe:随机
     * DateTime: 2020/5/14 22:49
     * @param $proArr
     * @return int|string
     */
    private function get_rand($proArr)
    {
        $result = '';
        $proSum = array_sum($proArr);
        foreach ($proArr as $key => $proCur) {
            $randNum = mt_rand(1, $proSum);
            if ($randNum <= $proCur) {
                $result = $key;
                break;
            } else {
                $proSum -= $proCur;
            }
        }
        unset ($proArr);
        return $result;
    }

    public function MarketDatas(){
        $period = array(
            1=>'1min',
            60=>'1hour',
            1440=>'1day',
        );
        $data = $this->request->param();
        $assets = json_decode(vpost("http://api.zb.center/data/v1/kline?market=btc_qc&type={$period[$data['period']]}&size={$data['coin_nums']}",""),true);
        $btc = json_decode(vpost("http://api.zb.center/data/v1/ticker?market=btc_qc",""),true);
        $result = array(
            'lastprice' => $btc['ticker']['sell'],
            'chg' => $btc['ticker']['riseRate'],
        );
        foreach($assets['data'] as $k => $v){
            $result['time'][$k] = $v[0]/1000;
            $result['date'][$k] = date('Y-m-d H:i:s',$v[0]/1000);
            $result['data'][$k] = array($v[1],$v[2],$v[3],$v[4]);
        }
        $this->success("OK",$result);
    }

    public function GetRealTimeDatas(){
        $ticker = json_decode(vpost("http://api.zb.center/data/v1/allTicker",''),true);
        $data = array(
            0=>array('coin_ad' => round($ticker['btcqc']['riseRate']/100,4),'coin_name'=>'BTC','coin_price'=>$ticker['btcqc']['sell']),
            1=>array('coin_ad' => round($ticker['ethqc']['riseRate']/100,4),'coin_name'=>'ETH','coin_price'=>$ticker['ethqc']['sell']),
            2=>array('coin_ad' => round($ticker['ltcqc']['riseRate']/100,4),'coin_name'=>'LTC','coin_price'=>$ticker['ltcqc']['sell']),
        );
        $this->success("OK",$data);
    }

    public function mall(){
        $uid = $this->app->session->get('uid');
        if(!$uid) $this->redirect('/index/login');
        $this->mall = Db::name('LcMall')->where("stock > 0")->order("sort asc,id desc")->select();
        $this->fetch();
    }

    public function futureslist(){
        $now = date('Y-m-d H:i:s');
        $this->item = Db::name('LcItem')->where("time <= '$now' AND round(percent) < 100")->order("sort asc,id desc")->select();
        $this->fetch();
    }

    /**
     * Describe:定时结算任务
     * DateTime: 2020/5/14 22:22
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     * @throws \think\exception\PDOException
     */
    public function item_crontab(){
        $now = time();
        $invest_list = Db::name("LcInvestList")->where("UNIX_TIMESTAMP(time1) <= $now AND status = '0'")->select();
        if(empty($invest_list)) exit('暂无返息计划');
        foreach($invest_list as $k=>$v){
            $data = array('time2' => date('Y-m-d H:i:s'), 'pay2' => $v['pay1'], 'status' => 1);
            if (Db::name("LcInvestList")->where(['id'=>$v['id']])->update($data)) {
                if($v['pay1']>0){
                    addFinance($v['uid'],$v['pay1'],1,$v['title'].' 第'.$v['num'].'期收益'.$v['pay1'].'元');
                    setNumber('LcUser', 'money', $v['pay1'], 1, "id = {$v['uid']}");
                    setNumber('LcUser', 'income', $v['money1'], 1, "id = {$v['uid']}");
                }
            }
        }
    }
    public function mall_crontab(){
        $now = time();
        $mall_invest_list = Db::name("LcMallInvestList")->where("UNIX_TIMESTAMP(time1) <= $now AND status = '0'")->select();
        if(empty($mall_invest_list)) exit('暂无返息计划');
        foreach($mall_invest_list as $k=>$v){
            $data = array('time2' => date('Y-m-d H:i:s'), 'pay2' => $v['pay1'], 'status' => 1);
            if (Db::name("LcMallInvestList")->where(['id'=>$v['id']])->update($data)) {
                if($v['pay1']>0){
                    addFinance($v['uid'],$v['pay1'],1,$v['title'].' 第'.$v['num'].'期收益'.$v['pay1'].'BTC');
                    if($v['tran_type']>1){
                        $btc_price = json_decode(vpost("http://api.zb.center/data/v1/ticker?market=btc_qc",''),true)['ticker']['sell'];
                        $money = round($btc_price*$data['buynum'],2);
                        addFinance($v['uid'],$money,1,"BTC兑换交易{$money}元");
                        setNumber('LcUser', 'money', $money, 1, "id = {$v['uid']}");
                    }else{
                        setNumber('LcUser', 'btc', $v['money1'], 1, "id = {$v['uid']}");
                    }
                }
                if($v['money2']>0){
                    addFinance($v['uid'],$v['money2'],1,$v['title'].'，保证金退还'.$v['pay1'].'元');
                    setNumber('LcUser', 'money', $v['money2'], 1, "id = {$v['uid']}");
                }
            }
        }
    }


    /**
     * Describe:最新公告
     * DateTime: 2020/5/14 21:02
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function notice(){
        $this->notice = Db::name('lcArticle')->where(['type'=>9,'show'=>1])->order("id desc")->select();
        $this->fetch();
    }

    public function goods(){
        $uid = $this->app->session->get('uid');
        if(!$uid) $this->redirect('/index/login');

        $id = $this->app->request->param('id');
        if(!$id) msg('无效参数',2,'/index');

        $this->info = Db::name('LcProduct')->find($id);
        if(!$this->info) msg('产品不存在',2,'/index');
        if($this->info['iskq']==0) msg('该产品没有开启,无法访问',2,'/index');
        $this->user = Db::name('LcUser')->find($uid);
        $weekday=date("w");
        if($weekday==0) $weekday=7;
        $ttimes=$this->info['opentime_'.$weekday];

        if(empty($ttimes)) msg('非交易时间，请选择其它商品！',2,'/index');
        //var_dump($this->info['opentime_'.$weekday],$weekday);die;
        if(!empty($ttimes)){
            $optime=0;
            $ttimesarr=explode("|",$ttimes);
            foreach($ttimesarr as $t){
                $t=explode('~',$t);
                if(time()>strtotime(date('Y-m-d '.$t[0])) and time()<strtotime(date('Y-m-d '.$t[1]))) $optime=$optime+1;
            }
            if($optime==0)  msg('非交易时间，请选择其它商品！',2,'/index');
        }
        
        $this->order_price = explode('|', trim(getinfo('order_amount')));

        $this->fetch();
    }

    public function goodsinfo(){
        $pid = $this->app->request->param('pid');
        $goods = Db::name('LcProduct')->find($pid);
        $res = base64_encode(json_encode($goods));
        return $res;
    }
    public function getchart(){
        $data['kaipan'] = '开盘';
        $data['zuidi'] = '最低';
        $data['zuigao'] = '最高';
        $data['Kxian'] = 'k线';
        $data['zoushi'] = '走势';
        $data['DIFF'] = 'DIFF:';
        $data['DEA'] = 'DEA:';
        $data['MACD'] = 'MACD:';
        $data['chicang'] = '持仓';
        $data['maizhang'] = '买涨';
        $data['maidie'] = '买跌';
        $data['xiushi'] = '休市中';
        $data['tousijine'] = '投资金额';
        $data['chicangmingxi'] ='持仓明细';
        $res = base64_encode(json_encode($data));
        return $res;
    }
    public function getprodata(){
        $pid = $this->app->request->param('pid');
        $data = Db::name('LcProduct')->field('Price,Open,Close,High,Low,UpdateTime')->find($pid);

        if(!$data){
            exit;
        }

        $topdata = array(
            'topdata'=>$data['UpdateTime'],
            'now'=>$data['Price'],
            'open'=>$data['Open'],
            'lowest'=>$data['Low'],
            'highest'=>$data['High'],
            'close'=>$data['Close']
        );
        exit(json_encode(base64_encode(json_encode($topdata))));
    }
    public function ajaxpro(){
        $id = $this->app->request->param('pid');

        // $pro = Db::name('LcProduct')->where('isdelete',0)->find($id);

        // if(!isset($pro)) return false;

        // $nowtime = time();
        // $_rand = rand(1,900)/100000;
        // $thisdatas = array();


        // $pro['procode'] = $pro['code'];
        // //验证休市
        // $isopen = 0;
        // if ($pro['isopen']) {
        //     $isopen = ChickIsOpen($pro['id']);
        // }
        // if(!$isopen){
        //     return false;
        // }

        // //腾讯证券
        // if($pro['procode'] == "btc" || $pro['procode'] == "ltc"|| $pro['procode'] == "eth"){

        //     $minute = date('i',$nowtime);
        //     if($minute >= 0 && $minute < 15){ $minute = 0;}
        //     elseif($minute >= 15 && $minute < 30){ $minute = 15;}
        //     elseif($minute >= 30 && $minute < 45){ $minute = 30;}
        //     elseif($minute >= 45 && $minute < 60){ $minute = 45;}
        //     $new_date = strtotime(date('Y-m-d H',$nowtime).':'.$minute.':00');

        //     if($pro['procode'] == 'btc'){
        //         $url = 'http://api.zb.live/data/v1/ticker?market=btc_usdt';
        //     }elseif($pro['procode'] == 'ltc'){
        //         $url = 'http://api.zb.live/data/v1/ticker?market=ltc_usdt';
        //     }elseif($pro['procode'] == 'eth'){
        //         $url = 'http://api.zb.live/data/v1/ticker?market=eth_usdt';
        //     }
        //     $getdata = $this->curlfun($url);
        //     $res = json_decode($getdata,1);
        //     $data_arr=$res['ticker'];

        //     if(!is_array($data_arr)) return false;
        //     $thisdata['Price'] = $this->fengkong($data_arr['sell'],$pro);;
        //     $thisdata['Open'] = $data_arr['buy'];
        //     $thisdata['Close'] = $data_arr['last'];
        //     $thisdata['High'] = $data_arr['high'];
        //     $thisdata['Low'] = $data_arr['low'];
        //     $thisdata['Diff'] = 0;
        //     $thisdata['DiffRate'] = 0;
        // }else{
        //     $url = "http://hq.sinajs.cn/rn=".$nowtime."list=".$pro['code'];

        //     $getdata = $this->curlfun($url);
        //     $data_arr = explode(',',$getdata);

        //     if(!is_array($data_arr) || count($data_arr) != 18) return false;

        //     $thisdata['Price'] = $data_arr[1];
        //     $thisdata['Open'] = $data_arr[5];
        //     $thisdata['Close'] = $data_arr[3];
        //     $thisdata['High'] = $data_arr[6];
        //     $thisdata['Low'] = $data_arr[7];
        //     $thisdata['Diff'] = $data_arr[12];
        //     $thisdata['DiffRate'] = $data_arr[4]/10000;
        // }
        // $thisdata['UpdateTime'] = $nowtime;
        // Db::name('LcProduct')->where('id',$pro['id'])->update($thisdata);

        $data = Db::name('LcProduct')->field('Price,Open,Close,High,Low,UpdateTime')->find($id);
        $data['UpdateTime'] = date('H:i:s',$data['UpdateTime']);
        return json($data);
    }
    public function ajaxdata(){
        // $list = Db::name('LcProduct')->where('isdelete',0)->select();

        // if(!isset($list)) return false;

        // $nowtime = time();
        // $_rand = rand(1,900)/100000;
        // $thisdatas = array();

        // foreach ($list as $k => $v) {
        //     $v['procode'] = $v['code'];
        //     //验证休市
        //     $isopen = 0;
        //     if ($v['isopen']) {
        //         $isopen = ChickIsOpen($v['id']);
        //     }
        //     if(!$isopen){
        //         continue;
        //     }

        //     //腾讯证券
        //     if($v['procode'] == "btc" || $v['procode'] == "ltc"|| $v['procode'] == "eth"){

        //         $minute = date('i',$nowtime);
        //         if($minute >= 0 && $minute < 15){ $minute = 0;}
        //         elseif($minute >= 15 && $minute < 30){ $minute = 15;}
        //         elseif($minute >= 30 && $minute < 45){ $minute = 30;}
        //         elseif($minute >= 45 && $minute < 60){ $minute = 45;}
        //         $new_date = strtotime(date('Y-m-d H',$nowtime).':'.$minute.':00');

        //         if($v['procode'] == 'btc'){
        //             $url = 'http://api.zb.live/data/v1/ticker?market=btc_usdt';
        //         }elseif($v['procode'] == 'ltc'){
        //             $url = 'http://api.zb.live/data/v1/ticker?market=ltc_usdt';
        //         }elseif($v['procode'] == 'eth'){
        //             $url = 'http://api.zb.live/data/v1/ticker?market=eth_usdt';
        //         }
        //         $getdata = $this->curlfun($url);
        //         $res = json_decode($getdata,1);
        //         $data_arr=$res['ticker'];

        //         if(!is_array($data_arr)) continue;
        //         $thisdata['Price'] = $this->fengkong($data_arr['sell'],$v);;
        //         $thisdata['Open'] = $data_arr['buy'];
        //         $thisdata['Close'] = $data_arr['last'];
        //         $thisdata['High'] = $data_arr['high'];
        //         $thisdata['Low'] = $data_arr['low'];
        //         $thisdata['Diff'] = 0;
        //         $thisdata['DiffRate'] = 0;
        //     }else{
        //         $url = "http://hq.sinajs.cn/rn=".$nowtime."list=".$v['code'];

        //         $getdata = $this->curlfun($url);
        //         $data_arr = explode(',',$getdata);

        //         if(!is_array($data_arr) || count($data_arr) != 18) continue;

        //         $thisdata['Price'] = $data_arr[1];
        //         $thisdata['Open'] = $data_arr[5];
        //         $thisdata['Close'] = $data_arr[3];
        //         $thisdata['High'] = $data_arr[6];
        //         $thisdata['Low'] = $data_arr[7];
        //         $thisdata['Diff'] = $data_arr[12];
        //         $thisdata['DiffRate'] = $data_arr[4]/10000;
        //     }
        //     $thisdata['UpdateTime'] = $nowtime;
        //     $ids = Db::name('LcProduct')->where('id',$v['id'])->update($thisdata);
        // }

        $product = Db::name('LcProduct')->field("id,title as Name,Price,isdelete,Open")->where(array('isdelete' => 0))->select();


        foreach( $product as $k=>$val) {
            $rd = rand(-3,3);
            //修改前端显示位数！！！
            $product[$k]['Price'] =round($val['Price'] +$rd*0.01*$val['Price'],3);
            $lastprice= session('price'.$val['id']);
            $product[$k]['is_rise']=($lastprice>=$val['Price'])?1:2;
            $product[$k]['is_deal'] = ChickIsOpen($val['id']);
            $product[$k]['Open'] = $val['Open'];
            //   $product[$k]['High'] = $val['High'];
            //       $product[$k]['Low'] = $val['Low'];
            $rate= $product[$k]['Price'] - $val['Open'];
            if($rate>0){
                $r = round((abs($rate)/$val['Open'])*100,2);
            }else{
                $r = '-'.round(abs($rate)/$val['Open']*100,2);

            }
            
            $product[$k]['rate']  = $r;
            session('price'.$val['id'],$product[$k]['Price']);
        }
        return  json_encode($product);





    }


    public function getkdata($pid=null,$num=null,$interval=null,$isres=null){
        // 设置超时时间，防止接口卡死
        ini_set('default_socket_timeout', 3);
        $pid = empty($pid)?$this->app->request->param('pid'):$pid;
        $num = empty($num)?$this->app->request->param('num'):$num;
        $num = empty($num)?30:$num;
        $pro = Db::name('LcProduct')->where(['id'=>$pid])->find();
        $all_data = array();
        $res_arr = array(); // 初始化变量，防止未定义错误

        if(!$pro){
            exit;
        }
        $interval = empty($interval)?$this->app->request->param('interval'):$interval;
        $interval = $this->app->request->param('interval') ? $this->app->request->param('interval') : 1;
        $nowtime = time().rand(100,999);
        if($interval == 'd'){
            $klength = 24*60*60*$num;
        }else{
            $klength = $interval*60*$num;
        }

        //数据库里的产品K线参考值

        if($klength == 'd') $klength = 1*60*24*$num;

        $k_map['pid'] = $pid;
        $k_map['ktime'] = array('between',array( ($nowtime - $klength),$nowtime ) );

        $pro['procode'] = $pro['code'];
        //guonei
        //var_dump(strpos($pro['procode'] ,"hf"));die;
        if(strpos($pro['procode'],"btc")!==false or strpos($pro['procode'],"usdt")!==false){
            switch ($interval) {
                case '1':
                    $datalen = "1min";
                    break;
                case '5':
                    $datalen = "5min";
                    break;
                case '15':
                    $datalen = "15min";
                    break;
                case '30':
                    $datalen = "30min";
                    break;
                case '60':
                    $datalen = "1hour";
                    break;
                case 'd':
                    $datalen = "1day";
                    break;
                default:
                    exit;
                    break;
            }
            $geturl = "http://api.bitkk.com/data/v1/kline?market=".$pro['procode'] ."&type=" . $datalen . "&size=" . $num;
            // if($pro['procode'] == "btc"){
            //     //$geturl = "http://api.zb.live/data/v1/kline?market=btc_usdt&type=".$datalen."&size=".$num;
            //     $geturl = "http://api.bitkk.com/data/v1/kline?market=btc_usdt&type=" . $datalen . "&size=" . $num;
            // }elseif($pro['procode'] == "ltc"){
            //     //$geturl = "http://api.zb.live/data/v1/kline?market=ltc_usdt&type=".$datalen."&size=".$num."&contract_type=this_week";
            //     $geturl = "http://api.bitkk.com/data/v1/kline?market=ltc_usdt&type=" . $datalen . "&size=" . $num;
            // }elseif($pro['procode'] == "eth"){
            // 	$geturl = "http://api.bitkk.com/data/v1/kline?market=eth_usdt&type=" . $datalen . "&size=" . $num;
            //     //$geturl = "http://api.zb.live/data/v1/kline?market=eth_usdt&type=".$datalen."&size=".$num;
            // }
            //$html = file_get_contents($geturl);
            // $a = json_decode($html);
            //if (isset($a->error) || isset($a->result)) { //如果在中币完没找到的 就去火币网找找
            $testacode=explode("_",$pro['procode']);
            $newcodess=$testacode[0].$testacode[1];
            $geturl = "https://api.huobi.pro/market/history/kline?period=" . $datalen . "&size=" . $num . "&symbol=" . $newcodess;

            try {
                // 使用 curl 替代 file_get_contents 以获得更好的超时控制和错误处理
                $html = $this->curlfun($geturl);
                if ($html === false || $html === null) {
                    $_data_arr = null;
                } else {
                    $_data_arr = json_decode($html, true);
                }
            } catch (\Exception $e) {
                $_data_arr = null;
            }

            if (isset($_data_arr['status']) && $_data_arr['status'] == 'ok') {
                foreach ($_data_arr['data'] as $k => $v) {
                    // 数据意义：时间(id) 开盘(open)，收盘(close)，最低(lowest)，最高(highest)
                    $res_arr[] = [$v['id'], $v['open'], $v['close'], $v['low'], $v['high']];
                }
            }
            //         } else {
            // var_dump($html);die;
            //         $html = substr($html,25,-22);

            //         $_data_arr = explode('],[',$html);

            //         foreach ($_data_arr as $k => $v) {
            //             $_son_arr = explode(',', $v);
            //             $res_arr[] = array($_son_arr[0]/1000,$_son_arr[1],$_son_arr[4],$_son_arr[3],$_son_arr[2]);
            //         }

            //         }
        }elseif(strpos($pro['code'],"fx_")!==false){
            switch ($interval) {
                case '1':
                    $datalen = 100;
                    break;
                case '5':
                    $datalen = 100;
                    break;
                case '15':
                    $datalen = 100;
                    break;
                case '30':
                    $datalen = 100;
                    break;
                case '60':
                    $datalen = 100;
                    break;
                case 'd':
                    break;
                default:
                    exit;
                    break;
            }

            $year = date('Y_n_j',time());

            if($interval == 'd'){

                $geturl = "http://vip.stock.finance.sina.com.cn/forex/api/jsonp.php/var%20_".$pro['procode']."$year=/NewForexService.getDayKLine?symbol=".$pro['procode']."&_=$year";
            }else{
                //$geturl = "http://vip.stock.finance.sina.com.cn/forex/api/jsonp.php/var%20_".$pro['procode']."_".$interval."_$nowtime=/NewForexService.getMinKline?symbol=".$pro['procode']."&scale=".$interval."&datalen=".$datalen;
                $geturl="http://vip.stock.finance.sina.com.cn/forex/api/jsonp.php/var%20_".$pro['procode']."_".$interval."_".time()."=/NewForexService.getMinKline?symbol=".$pro['procode']."&scale=1&datalen=".$datalen;
            }
            // echo $geturl;
            //break
            $html = file_get_contents($geturl);
            //var_dump($geturl,$html);die;
            if($interval == 'd'){
                $_arr = explode('("',$html);
                if(!isset($_arr[1])){
                    return;
                }
                $_str = substr($_arr[1],1,-4);
                $_data_arr = explode(',|',$_str);

            }else{
                $_arr = explode('[',$html);
                // if(time()>1623307991) die;
                if(!isset($_arr[1])){
                    return;
                }
                $_str = substr($_arr[1],1,-3);
                $_data_arr = explode('},{',$_str);

            }

            $_count = count($_data_arr);
            $_data_arr = array_slice($_data_arr,$_count-$num,$_count);

            foreach ($_data_arr as $k => $v) {

                $_son_arr = explode(',', $v);

                if($interval == 'd'){
                    $res_arr[] = array(
                        substr($_son_arr[0],5),
                        $_son_arr[1],
                        $_son_arr[4],
                        $_son_arr[2],
                        $_son_arr[3],

                    );
                }else{
                    if(in_array($pro['procode'],array(13,12,116))){
                        if($interval == 6){
                            $_ktime = substr($_son_arr[1],5,-1).' 00:00:00';
                        }else{
                            $_ktime = '2017-'.substr($_son_arr[1],5,-1);
                        }

                        $_time = $_ktime;
                        if(in_array($interval,array(1,5)) && isset($_kline[$_time])){
                            $_h = $_kline[$_time]['updata'];
                            $_l = $_kline[$_time]['downdata'];
                            $_o = $_kline[$_time]['opendata'];
                            $_c = $_kline[$_time]['closdata'];
                        }else{
                            $_h = substr($_son_arr[4],5,-1);
                            $_l = substr($_son_arr[2],5,-1);
                            $_o = substr($_son_arr[3],5,-1);
                            $_c = substr($_son_arr[3],5,-1);
                        }

                        $res_arr[] = array(
                            strtotime($_ktime),
                            $_o,
                            $_c,
                            $_l,
                            $_h,
                        );
                    }else{
                        $_time = strtotime(substr($_son_arr[0],5,-1));
                        //die(substr($_son_arr[0],5,-1));
                        if(in_array($interval,array(1,5)) && isset($_kline[$_time])){
                            $_h = $_kline[$_time]['updata'];
                            $_l = $_kline[$_time]['downdata'];
                            $_o = $_kline[$_time]['opendata'];
                            $_c = $_kline[$_time]['closdata'];
                        }else{
                            $_h = substr($_son_arr[3],5,-1);
                            $_l = substr($_son_arr[2],5,-1);
                            $_o = substr($_son_arr[1],5,-1);
                            $_c = substr($_son_arr[4],5,-1);
                        }
                        $res_arr[] = array($_time,$_o,$_c,$_h,$_l);
                    }
                }
            }
        }elseif(strpos($pro['code'],"hf_")!==false){
            switch ($interval) {
                case '1':
                    $datalen = 100;
                    break;
                case '5':
                    $datalen = 100;
                    break;
                case '15':
                    $datalen = 100;
                    break;
                case '30':
                    $datalen = 100;
                    break;
                case '60':
                    $datalen = 100;
                    break;
                case 'd':
                    break;
                default:
                    exit;
                    break;
            }
            $test=explode("_",$pro['procode']);
            if($interval=="d"){
                $geturl="https://stock2.finance.sina.com.cn/futures/api/jsonp.php/var%20_".$test[1]."2020_9_13=/GlobalFuturesService.getGlobalFuturesDailyKLine?symbol=".$test[1]."&_=2020_9_13&source=web";
                $html = file_get_contents($geturl);
                $klmin1=explode("=",$html);
                $klmin1=str_replace("(","",$klmin1);
                $klmin1=str_replace(")","",$klmin1);
                $klmin1=str_replace(";","",$klmin1);
                $klmin1=json_decode($klmin1[2],true);
                $countnum=count($klmin1)-100;
                // if(time()>1623307991) die;
                foreach ($klmin1 as $k => $v) {
                    //$_son_arr = explode(',', $v);
                    if($k<$countnum) continue;
                    $res_arr[] = array(
                        strtotime($v["date"]),  //时间
                        $v["open"],   //开
                        $v["close"],   //收
                        $v["low"],   //低
                        $v["high"],   //高
                    );
                }
            }else{
                $geturl="https://gu.sina.cn/ft/api/jsonp.php/var%20_".$test[1]."_1_1599996658618=/GlobalService.getMink?symbol=".$test[1]."&type=".$interval."&datalen=100";

                $html = file_get_contents($geturl);
                //var_dump($geturl,$html);die;
                $klmin1=explode("=",$html);
                $klmin1=str_replace("(","",$klmin1);
                $klmin1=str_replace(")","",$klmin1);
                $klmin1=str_replace(";","",$klmin1);
                $klmin1=json_decode($klmin1[2],true);
                $countnum=count($klmin1)-100;
                // if(time()>1623307991) die;
                foreach ($klmin1 as $k => $v) {
                    //$_son_arr = explode(',', $v);
                    if($k<$countnum) continue;
                    $res_arr[] = array(
                        strtotime($v["d"]),  //时间
                        $v["o"],   //开
                        $v["c"],   //收
                        $v["l"],   //低
                        $v["h"],   //高
                    );
                }
            }
        }elseif(strpos($pro['code'],"sz")!==false or strpos($pro['code'],"sh")!==false){
            //echo ("sz");
            if($interval=="1"){
                //目前没有一分钟K线。
                $geturl="https://web.ifzq.gtimg.cn/appstock/app/minute/query?code=".$pro['code'];
                $html = json_decode(file_get_contents($geturl),true);
                $newdatas=$html['data'][$pro['code']]['data']['data'];
                $tradetime=$html['data'][$pro['code']]['data']['date'];
                //$newdatas=$newdatas;
                foreach($newdatas as $x=>$v){
                    $v=explode(" ",$v);
                    $res_arr[] = array(
                        strtotime($tradetime.$v['0']),  //时间
                        $v[1],   //开
                        $v[1],   //收
                        $v[1],   //低
                        $v[1],   //高
                    );
                }
            }elseif($interval=="d"){
                $geturl="http://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=".$pro['code']."&scale=240&ma=12&datalen=100";
                $html = json_decode(file_get_contents($geturl),true);

                //$newdatas=$newdatas;
                foreach($html as $x=>$v){

                    $res_arr[] = array(
                        strtotime($v['day']),  //时间
                        $v['open'],   //开
                        $v['close'],   //收
                        $v['low'],   //低
                        $v['high'],   //高
                    );
                }

            }else{
                $geturl="http://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=".$pro['code']."&scale=".$interval."&ma=12&datalen=100";
                $html = json_decode(file_get_contents($geturl),true);
                //var_dump($html);die;
                foreach($html as $x=>$v){

                    $res_arr[] = array(
                        strtotime($v['day']),  //时间
                        $v['open'],   //开
                        $v['close'],   //收
                        $v['low'],   //低
                        $v['high'],   //高
                    );
                }
            }
        }elseif(strpos($pro['code'],"index")!==false){
            $newcodesss=explode("_",$pro['code']);

            if($interval=="d"){
                $geturl ="https://vip.stock.finance.sina.com.cn/forex/api/jsonp.php/var%20_".$newcodesss[0]."=/NewForexService.getDayKLine?symbol=".$newcodesss[0]."&&source=wap";
                $html = file_get_contents($geturl);

                $_arr = explode('("',$html);
                if(!isset($_arr[1])){
                    return;
                }
                $_str = substr($_arr[1],1,-4);
                $_data_arr = explode(',|',$_str);
                $_count = count($_data_arr);
                $num=100;
                $_data_arr = array_slice($_data_arr,$_count-$num,$_count);
                ///var_dump($_data_arr);die;

                foreach ($_data_arr as $k => $v) {
                    $_son_arr = explode(',', $v);
                    $res_arr[] = array(
                        strtotime($_son_arr[0]),
                        $_son_arr[1],
                        $_son_arr[4],
                        $_son_arr[2],
                        $_son_arr[3],

                    );

                }

                //	var_dump($_data_arr);die;


            }elseif(in_array($interval,array(1,5,15,30,60))){
                $geturl="https://vip.stock.finance.sina.com.cn/forex/api/jsonp.php/var%20_".$newcodesss[0]."_1_".time()."=/NewForexService.getOldMinKline?symbol=".$newcodesss[0]."&scale=".$interval."&datalen=100";
                $html = file_get_contents($geturl);
                $_arr = explode('=',$html);
                $_arr=str_replace("(","",$_arr[2]);
                $html=str_replace(")","",$_arr);
                $html=str_replace("[","",$html);
                $html=str_replace("]","",$html);
                $html=str_replace('},{','}+{',$html);
                $html=str_replace(';','',$html);
                $html=explode('+',$html);
                //var_dump($html);die;
                foreach($html as $x=>$v){
                    //var_dump($x);
                    $t=json_decode($v,true);
                    //var_dump($x,$t);
                    $res_arr[$x] = array(
                        strtotime($t["d"]),  //时间
                        $t["o"],   //开
                        $t["c"],   //收
                        $t["l"],   //低
                        $t["h"],   //高
                    );
                }
            }
        }


        //以下是整体处理。
        //var_dump($pro);die;

        // 如果没有获取到K线数据，直接返回当前价格信息，避免报错
        if(empty($res_arr)){
            $all_data['topdata'] = array(
                'topdata'=>strtotime("now"),
                'now'=>$pro['Price'],
                'open'=>$pro['Open'],
                'lowest'=>$pro['Low'],
                'highest'=>$pro['High'],
                'close'=>$pro['Close'],
                'state'=>'down'
            );
            $all_data['items'] = [];
            if($isres){
                return (json_encode($all_data));
            }else{
                exit(json_encode(base64_encode(json_encode($all_data))));
            }
        }

        if($pro['Price'] < $res_arr[$num-1][1]){
            $_state = 'down';
        }else{
            $_state = 'up';
        }

        $all_data['topdata'] = array(
            'topdata'=>strtotime("now"),
            'now'=>$pro['Price'],
            'open'=>$pro['Open'],
            'lowest'=>$pro['Low'],
            'highest'=>$pro['High'],
            'close'=>$pro['Close'],
            'state'=>$_state
        );

        $all_data['items'] = $res_arr;
        if($isres){
            return (json_encode($all_data));
        }else{
            exit(json_encode(base64_encode(json_encode($all_data))));
        }
    }
    //curl获取数据
    public function curlfun($url, $params = array(), $method = 'GET')
    {
        $header = array();
        $opts = array(CURLOPT_TIMEOUT => 10, CURLOPT_RETURNTRANSFER => 1, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => false, CURLOPT_HTTPHEADER => $header);

        /* 根据请求类型设置特定参数 */
        switch (strtoupper($method)) {
            case 'GET' :
                $opts[CURLOPT_URL] = $url . '?' . http_build_query($params);
                $opts[CURLOPT_URL] = substr($opts[CURLOPT_URL],0,-1);

                break;
            case 'POST' :
                //判断是否传输文件
                $params = http_build_query($params);
                $opts[CURLOPT_URL] = $url;
                $opts[CURLOPT_POST] = 1;
                $opts[CURLOPT_POSTFIELDS] = $params;
                break;
            default :
        }

        /* 初始化并执行curl请求 */
        $ch = curl_init();
        curl_setopt_array($ch, $opts);
        $data = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if($error){
            $data = null;
        }

        return $data;
    }

    /**
     * 数据风控
     * @author lukui  2017-06-27
     * @param  [type] $price [description]
     * @param  [type] $pro   [description]
     * @return [type]        [description]
     */
    public function fengkong($price,$pro)
    {

        $point_low = $pro['point_low'];
        $point_top = $pro['point_top'];

        $FloatLength = getFloatLength($point_top);
        $jishu_rand = pow(10,$FloatLength);
        $point_low = $point_low * $jishu_rand;
        $point_top = $point_top * $jishu_rand;
        $rand = rand($point_low,$point_top)/$jishu_rand;

        $_new_rand = rand(0,10);
        if($_new_rand % 2 == 0){
            $price = $price + $rand;
        }else{
            $price = $price - $rand;
        }
        return $price;
    }

    /**
     * 全局产品更新
     * @return [type] [description]
     */
    public function product(){
        $list = Db::name('LcProduct')->where('isdelete',0)->select();

        if(!isset($list)) return false;

        $nowtime = time();
        $_rand = rand(1,900)/100000;
        $thisdatas = array();

        foreach ($list as $k => $v) {
            $v['procode'] = $v['code'];

            if(strpos($v['procode'] ,"index")!==false){
                $indexcode=explode("_",$v['procode']);
                $v['procode']=$indexcode[0];
            }
            //验证休市
            $isopen = 0;
            if ($v['isopen']) {
                $isopen = ChickIsOpen($v['id']);

                //var_dump($v);exit();
            }
            if(!$isopen){
                continue;
            }

            //腾讯证券
            if(strpos($v['procode'],"btc")!==false or strpos($v['procode'],"usdt")!==false){
                $testcode=explode('_',$v['procode']);
                $procode=$testcode[0].$testcode[1];
                //if($v['procode'] == "btc" || $v['procode'] == "ltc"|| $v['procode'] == "eth"){

                $minute = date('i',$nowtime);
                if($minute >= 0 && $minute < 15){ $minute = 0;}
                elseif($minute >= 15 && $minute < 30){ $minute = 15;}
                elseif($minute >= 30 && $minute < 45){ $minute = 30;}
                elseif($minute >= 45 && $minute < 60){ $minute = 45;}
                $new_date = strtotime(date('Y-m-d H',$nowtime).':'.$minute.':00');
                $url = 'https://api.huobi.pro/market/history/kline?period=1day&size=2&symbol='.$procode;
                // if($v['procode'] == 'btc'){
                //     $url = 'https://api.huobi.pro/market/history/kline?period=1min&size=1&symbol=btcusdt';
                // }elseif($v['procode'] == 'ltc'){
                //     $url = 'https://api.huobi.pro/market/history/kline?period=1min&size=1&symbol=ltcusdt';
                // }elseif($v['procode'] == 'eth'){
                //     $url = 'https://api.huobi.pro/market/history/kline?period=1min&size=1&symbol=ethusdt';
                // }
                $data_arr = json_decode($this->curlfun($url), true); //dump($url);dump($data_arr);
                if ($data_arr['status'] != 'ok') continue;
                $thisdata['Price'] = $data_arr['data']['0']['close']; //价格 没有 只能给收盘价
                $thisdata['Open'] = $data_arr['data']['0']['open']; //开盘价
                $thisdata['Close'] = $data_arr['data']['1']['close']; //收盘价
                $thisdata['High'] = $data_arr['data']['0']['high']; //最高价
                $thisdata['Low'] = $data_arr['data']['0']['low']; 
                $thisdata['Diff'] = $data_arr['data']['0']['close']-$data_arr['data']['1']['close'];
                // var_dump($data_arr);die;
                // $getdata = $this->curlfun($url);
                // $res = json_decode($getdata,1);
                // $data_arr=$res['ticker'];
                // if(!is_array($data_arr)) continue;
                // $thisdata['Price'] = $this->fengkong($data_arr['sell'],$v);;
                // $thisdata['Open'] = $data_arr['buy'];
                // $thisdata['Close'] = $data_arr['last'];
                // $thisdata['High'] = $data_arr['high'];
                // $thisdata['Low'] = $data_arr['low'];
                $thisdata['Diff'] = 0;
                $thisdata['DiffRate'] = 0;
            }else{
                $url = "http://hq.sinajs.cn/rn=".$nowtime."list=".$v['procode'];
                $getdata = $this->curlfun($url);
                //var_dump($getdata);
                if(strpos($v['procode'] ,"fx_")!==false){
                    $data_arr = explode(',',$getdata);
                    if(!is_array($data_arr) || count($data_arr) != 18) continue;
                    $thisdata['Price'] = $data_arr[1];
                    $thisdata['Open'] = $data_arr[5];
                    $thisdata['Close'] = $data_arr[3];
                    $thisdata['High'] = $data_arr[6];
                    $thisdata['Low'] = $data_arr[7];
                    $thisdata['Diff'] = $data_arr[12];
                    $thisdata['DiffRate'] = $data_arr[4]/10000;
                }elseif(strpos($v['procode'] ,"hf_")!==false){
                    $data_arr = explode(',',$getdata);
                    if (!is_array($data_arr) || count($data_arr) != 15) continue;
                    $thisdata['Price'] = str_replace('"', '', explode('=', $data_arr['0'])['1']);  //最新价
                    $thisdata['Open'] = $data_arr[8];  //开盘价
                    $thisdata['Close'] = $data_arr[7];  //昨日结算
                    $thisdata['High'] = $data_arr[4]; //最高价
                    $thisdata['Low'] = $data_arr[5]; //最低价
                    $thisdata['Diff'] = $thisdata['Price']-$thisdata['Close'];  //涨幅=最新价-昨日结算
                    $thisdata['DiffRate'] = $thisdata['Diff']/$thisdata['Close'];  //涨幅度=涨幅/昨日结算

                }elseif(strpos($v['procode'],"sh")!==false or strpos($v['procode'],"sz")!==false){
                    //echo $v['code'];

                    continue;
                    $data_arr = explode(',',$getdata);
                    //if (!is_array($data_arr) || count($data_arr) != 15) continue;
                    //var_dump($data_arr);
                    $thisdata['Price'] = isset($data_arr[3])?$data_arr[3]:0;  //最新价
                    $thisdata['Open'] = isset($data_arr[1])?$data_arr[1]:0;  //开盘价
                    $thisdata['Close'] = isset($data_arr[2])?$data_arr[2]:0;  //昨日结算
                    $thisdata['High'] = isset($data_arr[4])?$data_arr[4]:0; //最高价
                    $thisdata['Low'] = isset($data_arr[5])?$data_arr[5]:0; //最低价
                    $thisdata['Diff'] = $thisdata['Price']-$thisdata['Close'];  //涨幅=最新价-昨日结算
                    $thisdata['DiffRate'] = $thisdata['Diff']/$thisdata['Close'];  //涨幅度=涨幅/昨日结算
                }elseif(strpos($v['code'] ,"index")!==false){
                    //因为指数的procode处理过转换，这里判断要用原来的code
                    //var hq_str_DINIW="11:08:56,90.3546,90.3546,90.1638,2133,90.1640,90.3704,90.1571,90.3546,美元指数,2021-05-12";
                    //var_dump($getdata);die;
                    $data_arr = explode(',',$getdata);
                    $thisdata['Price'] = $data_arr[1];  //最新价
                    $thisdata['Open'] = $data_arr[5];  //开盘价
                    $thisdata['Close'] = $data_arr[3];  //昨日结算
                    $thisdata['High'] = $data_arr[6]; //最高价
                    $thisdata['Low'] = $data_arr[7]; //最低价
                    $thisdata['Diff'] = $thisdata['Price']-$thisdata['Close'];  //涨幅=最新价-昨日结算
                    $thisdata['DiffRate'] = $thisdata['Diff']/$thisdata['Close'];  //涨幅度=涨幅/昨日结算
                }




            }
            $thisdata['UpdateTime'] = $nowtime;
            $ids = Db::name('LcProduct')->where('id',$v['id'])->update($thisdata);
        }
        exit;

    }
    /**
     * 全局平仓
     * @return [type] [description]
     */
    public function order()
    {

        $nowtime = time();
        //var_dump($nowtime);die;
        //订单列表
        $map[] = ['ostaus','=',0];
        $map[] = ['selltime','<',$nowtime];
        $orderlist = Db::name('LcOrder')->where($map)->limit(0,50)->select();

        if(!$orderlist){
            //exit(dump('没有订单需要处理！'));
            die;
        }

        //风控参数
        $risk = Db::name('LcRisk')->find();
        $to_win = explode('|',$risk['to_win']);
        $to_loss = explode('|',$risk['to_loss']);
        $chance = $risk["chance"];
        $wenyin = explode('-',$risk['wenyin']);  //稳赢时间
        $wenshu =explode('-',$risk['wenshu']);//稳输时间

        $is_to_loss = array();
        $is_to_win = array();
        //买涨金额，计算过盈亏比例以后的
        $up_price = 0;
        //买跌金额，计算过盈亏比例以后的
        $min_buyprice = 0;
        //买入最低价
        $down_price = 0;
        //买入最高价
        $max_buyprice = 0;
        //下单最大金额
        $max_fee = 0;


        //此刻产品价格
        $pro = Db::name('LcProduct')->field('id as pid,Price,downps,upps')->where(array('isdelete' => 0))->select();
        $upps=array();
        $downps=array();

        $data_info =Db::name('LcProduct');
        $prodata = array();
        foreach ($pro as $k => $v) {
            $prodata[$v['pid']] = $v['Price'];
            $upps[$v['pid']] =$v['upps'];
            $downps[$v['pid']]=$v['downps'];
        }



        //循环处理订单
        $nowtime = time();
        $kt=count($orderlist);
        $h=date("H:i");
        //var_dump($orderlist);die;
        foreach ($orderlist as $k => $v) {
            $uid = $v['uid'];
            $pid = $v['pid'];
            $sellprice = isset($prodata[$v['pid']])?$prodata[$v['pid']]:0;
            $sellprice = $v['sellprice'] == 0 ? $sellprice : $v['sellprice'];

            //单控 赢利
            if($v['kong_type'] == '1' || $v['kong_type'] == '3'){
                $dankong_ying = $v;
            }
            //单控 亏损
            if($v['kong_type'] == '2' | $v['kong_type'] == '4'){
                $dankong_kui = $v;
            }
            //是否存在指定盈利
            if(in_array($v['uid'], $to_win)){
                $is_to_win = $v;
            }
            //是否存在指定亏损
            if(in_array($v['uid'], $to_loss)){
                $is_to_loss = $v;
            }
            //买涨买跌累加
            if($v['ostyle'] == 0){
                $up_price += $v['fee']*$v['endloss']/100;
            }else{
                $down_price += $v['fee']*$v['endloss']/100;
            }

            $min_buyprice = $v['buyprice'];
            $max_buyprice = $v['buyprice'];
            $max_fee = $v['fee'];


            $proinfo= Db::name('LcProduct')->where('id',$v['pid'])->find();

            //根据现在的价格算出风控点
            $FloatLength = getFloatLength((float)$proinfo['Price']);

            if($FloatLength == 0){
                $FloatLength = getFloatLength($proinfo['point_top']);
            }

            //是否存在指定盈利
            $is_do_price = 0; 	//是否已经操作了价格
            $jishu_rand = pow(10,$FloatLength);
            $beishu_rand = rand(1,10);
            $data_rands=$proinfo['rands'];

            $data_randsLength = getFloatLength($data_rands);

            if($data_randsLength > 0){
                //var_dump($proinfo);
                $_j_rand = pow(100,$data_randsLength)*$data_rands;
                //$_j_rand=$_s_rand = 0;
                $_s_rand = rand(1,$_j_rand)/pow(100,$data_randsLength);
            }else{
                $_s_rand = 0;
            }

            $do_rand = $_s_rand ;

            //先考虑单控
            if(!empty($dankong_ying) && $is_do_price == 0){ 		//单控 1赢利
                if($dankong_ying['ostyle'] == 0 ){
                    $pro['Price'] = $v['buyprice'] + $do_rand;
                }elseif($dankong_ying['ostyle'] == 1 ){
                    $pro['Price'] = $v['buyprice'] - $do_rand;
                }
                $is_do_price = 1;
            }

            if(!empty($dankong_kui) && $is_do_price == 0){ 		//单控 2亏损
                if($dankong_kui['ostyle'] == 0  ){
                    $pro['Price'] = $v['buyprice'] - $do_rand;
                }elseif($dankong_kui['ostyle'] == 1 ){
                    $pro['Price'] = $v['buyprice'] + $do_rand;
                }
                $is_do_price = 1;
            }

            //时间区间判断 稳赢
            if(isset($wenyin) && !empty($wenyin[0])){
                if( $h>=$wenyin[0] && $h <=$wenyin[1] && $is_do_price==0 ){

                    if($v['ostyle'] == 0 ){
                        $pro['Price'] = $v['buyprice'] + $do_rand;
                    }elseif($v['ostyle'] == 1 ){
                        $pro['Price'] = $v['buyprice'] - $do_rand;
                    }
                    $is_do_price = 1;
                }
            }


            //时间区间判断 稳输
            if(isset($wenshu) && !empty($wenshu[0]) ){

                if( $h>=$wenshu[0] && $h <=$wenshu[1] && $is_do_price==0 ){
                    if($v['ostyle'] == 0 ){
                        $pro['Price'] = $v['buyprice'] - $do_rand;
                    }elseif($v['ostyle'] == 1 ){
                        $pro['Price'] = $v['buyprice'] + $do_rand;
                    }
                    $is_do_price = 1;
                }
            }



            //var_dump($is_do_price);
            //指定客户赢利
            if(!empty($is_to_win) && $is_do_price == 0){

                if($is_to_win['ostyle'] == 0 ){
                    $pro['Price'] = $v['buyprice'] + $do_rand;
                }elseif($is_to_win['ostyle'] == 1 ){
                    $pro['Price'] = $v['buyprice'] - $do_rand;
                }
                $is_do_price = 1;
            }

            //是否存在指定亏损
            if(!empty($is_to_loss) && $is_do_price == 0){
                if($is_to_loss['ostyle'] == 0 ){
                    $pro['Price'] = $v['buyprice'] - $do_rand;
                }elseif($is_to_loss['ostyle'] == 1 ){
                    $pro['Price'] = $v['buyprice'] + $do_rand;
                }
                $is_do_price = 1;
            }


            //没有任何下单记录
            if($up_price == 0 && $down_price == 0 && $is_do_price == 0){
                $is_do_price = 2;
            }


            //只有一个人下单，或者所有人下单买的方向相同
            if(( ($up_price == 0 && $down_price != 0) || ($up_price != 0 && $down_price == 0) )  && $is_do_price == 0 ){

                //风控参数
                $chance_1 = explode('|',$chance);

                $chance_1 = array_filter($chance_1);

                //循环风控参数
                if(count($chance_1) >= 1){
                    foreach ($chance_1 as $key => $value) {
                        //切割风控参数
                        $arr_1 = explode(":",$value);
                        $arr_2 = explode("-",$arr_1[0]);

                        //比较最大买入价格
                        if($max_fee >= $arr_2[0] && $max_fee < $arr_2[1]){
                            //得出风控百分比
                            if(!isset($arr_1[1])){
                                $chance_num = 30;
                            }else{
                                $chance_num = $arr_1[1];
                            }
                            $_rand = rand(1,100);
                        }

                    }
                }

                //买涨
                if(isset($_rand) && $up_price != 0){
                    if($_rand > $chance_num){	//客损
                        $pro['Price'] = $min_buyprice-$do_rand;
                        $is_do_price = 1;
                    }else{		//客赢
                        $pro['Price'] = $max_buyprice+$do_rand;
                        $is_do_price = 1;

                    }

                }
                if(isset($_rand) && $down_price != 0){
                    if($_rand > $chance_num){	//客损
                        $pro['Price'] = $max_buyprice+$do_rand;
                        $is_do_price = 1;
                    }else{		//客赢
                        $pro['Price'] = $min_buyprice-$do_rand;
                        $is_do_price = 1;

                    }

                }
            }


            //多个人下单，并且所有人下单买的方向不相同
            if($up_price != 0 && $down_price != 0  && $is_do_price == 0){
                //买涨大于买跌的
                if ($up_price > $down_price) {
                    $pro['Price'] = $min_buyprice-$do_rand;
                    $is_do_price = 1;
                }
                //买涨小于买跌的
                if ($up_price < $down_price) {
                    $pro['Price'] = $max_buyprice+$do_rand;
                    $is_do_price = 1;
                }
                if ($up_price == $down_price) {
                    $is_do_price = 2;
                }
            }
            //$pro['Price']=0;
            if($is_do_price == 2 || $is_do_price == 0){

                //continue;
                //if($pro['Price']==0 or $pro['Price']=="") continue;
                $pro['Price'] = $this->fengkong($sellprice,$proinfo);
            }
            //var_dump($to_win,$is_to_win,$is_do_price,$pro['Price'] );die;
            //时间区间判断

            //$sellprice=	$pro['Price'];


            //此刻可平仓价位

            if($sellprice == 0){
                // continue;
            }
            //买入价
            $buyprice = $v['buyprice'];
            $fee = $v['fee'];
            $sellprice=$pro['Price'];
            $downpss=array();
            $uppss=array();
            $addupps=0;
            $adddownps=0;
            $order_cha = round(floatval($sellprice)-floatval($buyprice),6);
            //var_dump($upps);die;
            if(!empty($upps[$v['pid']])){
                $uppss=explode("-",$upps[$v['pid']]);
                $addupps=$v['endloss']*mt_rand($uppss[0]*100,$uppss[1]*100)/100;
            }else{
                $addupps=0;
            }
            if(!empty($downps[$v['pid']])){
                $downpss=explode("-",$downps[$v['pid']]);
                $adddownps=$v['lossrate']*mt_rand($downpss[0]*100,$downpss[1]*100)/100;

            }else{
                $adddownps=0;
            }

            //var_dump($uppss,$downpss,$addupps,$adddownps);die;


            if($nowtime >= $v['selltime']){
                //买涨

                if($v['ostyle'] == 0){

                    if($order_cha > 0){  //盈利
                        $yingli = $v['fee']*($v['endloss']/100)+round($addupps,2);
                        $d_map['is_win'] = 1;

                        //平仓增加用户金额
                        $u_add = $yingli + $fee;

                        $d_map['endloss']=$yingli;
                    }elseif($order_cha < 0){    //亏损
                        $yingli = $v['fee'] - ($v['fee']*$v['lossrate']/100)-round($adddownps,2);
                        $d_map['is_win'] = 2;

                        //平仓增加用户金额
                        $u_add = round($yingli,2);

                        $yingli = round(-($v['fee']*$v['lossrate']/100)-round($adddownps,2),2);

                        $d_map['endloss']=$yingli;
                    }else{      //无效
                        $yingli = 0;
                        $d_map['is_win'] = 3;
                        //平仓增加用户金额
                        $u_add = $fee;
                    }
                }

                //买跌
                if($v['ostyle']==1){
                    if($order_cha < 0){  //盈利
                        $yingli = $v['fee']*($v['endloss']/100)+round($addupps,2);

                        $d_map['is_win'] = 1;

                        //平仓增加用户金额
                        $u_add = $yingli + $fee;

                        $d_map['endloss']=$yingli;

                    }elseif($order_cha > 0){    //亏损
                        $yingli = $v['fee'] - ($v['fee']*$v['lossrate']/100)-round($adddownps,2);
                        $d_map['is_win'] = 2;

                        //平仓增加用户金额
                        $u_add = round($yingli,2);

                        $yingli = round(-($v['fee']*$v['lossrate']/100)-round($adddownps,2),2);
                        $d_map['endloss']=$yingli;

                    }else{      //无效
                        $yingli = 0;
                        $d_map['is_win'] = 3;
                        //平仓增加用户金额
                        $u_add = $fee;
                    }

                }


                addFinance($uid, $u_add, 1, '订单['.$v['orderno'].']平仓获得金额 ' . $u_add . '元');
                setNumber('LcUser', 'money', $u_add, 1, "id = $uid");
                //写入日志
                $o_log['uid'] = $uid;
                $o_log['oid'] = $v['id'];
                $o_log['addprice'] = $u_add;
                $o_log['addpoint'] = 0;
                $o_log['time'] = time();
                $o_log['user_money'] = Db::name('LcUser')->where('id',$uid)->value('money');
                Db::name('LcOrderLog')->insert($o_log);

                //平仓处理订单
                $d_map['ostaus'] = 1;
                $d_map['sellprice'] = $sellprice;
                $d_map['ploss'] = $yingli;
                Db::name('LcOrder')->where('id',$v['id'])->update($d_map);
            }
        }

    }
    /**
     * 订单类型
     * @param  [type] $orders [description]
     * @return [type]         [description]
     */
    public function order_type($orders,$pro,$risk,$data_info){
        $_prcie = $pro['Price'];
        $pid = $pro;
        $thispro = array();		//买此产品的用户
        //此产品购买人数
        $price_num = 0;
        //买涨金额，计算过盈亏比例以后的
        $up_price = 0;
        //买跌金额，计算过盈亏比例以后的
        $down_price = 0;
        //买入最低价
        $min_buyprice = 0;
        //买入最高价
        $max_buyprice = 0;
        //下单最大金额
        $max_fee = 0;
        //指定客户亏损
        $to_win = explode('|',$risk['to_win']);

        $is_to_win = array();
        //指定客户亏损
        $to_loss = explode('|',$risk['to_loss']);

        $is_to_loss = array();
        $i = 0;

        foreach ($orders as $k => $v) {
            if($v['pid'] == $pid ){
                //没炒过最小风控值直接退出price
                if ($v['fee'] < $risk['min_price']) {
                    //return $pro['Price'];
                    echo 2222;
                }
                $i++;

                //单控 赢利  全赢
                if($v['kong_type'] == '1' || $v['kong_type'] == '3'){
                    $dankong_ying = $v;
                    break;
                }
                //单控 亏损   全亏
                if($v['kong_type'] == '2'|| $v['kong_type'] == '4' ){
                    $dankong_kui = $v;
                    break;
                }
                echo $v['uid'];
                //是否存在指定盈利
                if(in_array($v['uid'], $to_win)){
                    $is_to_win = $v;
                    break;
                }
                //是否存在指定亏损
                if(in_array($v['uid'], $to_loss)){
                    $is_to_loss = $v;
                    break;
                }

                //总下单人数
                $price_num++;
                //买涨买跌累加
                if($v['ostyle'] == 0){
                    $up_price += $v['fee']*$v['endloss']/100;
                }else{
                    $down_price += $v['fee']*$v['endloss']/100;
                }
                //统计最大买入价与最大下单价
                if($i == 1){
                    $min_buyprice = $v['buyprice'];
                    $max_buyprice = $v['buyprice'];
                    $max_fee = $v['fee'];
                }else{
                    if($min_buyprice > $v['buyprice']){
                        $min_buyprice = $v['buyprice'];

                    }
                    if($max_buyprice < $v['buyprice']){
                        $max_buyprice = $v['buyprice'];
                    }
                    if($max_fee < $v['fee']){
                        $max_fee = $v['fee'];
                    }
                }
            }

        }


        $proinfo = $data_info->where('id',$pid)->find();

        //根据现在的价格算出风控点
        $FloatLength = getFloatLength((float)$pro['Price']);
        if($FloatLength == 0){
            $FloatLength = getFloatLength($proinfo['point_top']);
        }

        //是否存在指定盈利
        $is_do_price = 0; 	//是否已经操作了价格
        $jishu_rand = pow(10,$FloatLength);
        $beishu_rand = rand(1,10);
        $data_rands =$proinfo['rands'] ;

        $data_randsLength = getFloatLength($data_rands);

        if($data_randsLength > 0){
            $_j_rand = pow(200,$data_randsLength)*$data_rands;
            $_s_rand = rand(1,$_j_rand)/pow(10,$data_randsLength);

        }else{
            $_s_rand = 0;

        }
        $do_rand = $_s_rand;

        //先考虑单控
        if(!empty($dankong_ying) && $is_do_price == 0){ 		//单控 1赢利
            if($dankong_ying['ostyle'] == 0 ){
                $pro['Price'] = $v['buyprice'] + $do_rand;
            }elseif($dankong_ying['ostyle'] == 1 ){
                $pro['Price'] = $v['buyprice'] - $do_rand;
            }
            $is_do_price = 1;
        }
        if(!empty($dankong_kui) && $is_do_price == 0){ 		//单控 2亏损
            if($dankong_kui['ostyle'] == 0  ){
                $pro['Price'] = $v['buyprice'] - $do_rand;
            }elseif($dankong_kui['ostyle'] == 1 ){
                $pro['Price'] = $v['buyprice'] + $do_rand;
            }

            //echo 2;
            $is_do_price = 1;
        }

        //指定客户赢利
        if(!empty($is_to_win) && $is_do_price == 0){

            if($is_to_win['ostyle'] == 0 ){
                $pro['Price'] = $v['buyprice'] + $do_rand;
            }elseif($is_to_win['ostyle'] == 1 ){
                $pro['Price'] = $v['buyprice'] - $do_rand;
            }
            $is_do_price = 1;

        }
        //是否存在指定亏损
        if(!empty($is_to_loss) && $is_do_price == 0){


            if($is_to_loss['ostyle'] == 0 ){
                $pro['Price'] = $v['buyprice'] - $do_rand;
            }elseif($is_to_loss['ostyle'] == 1 ){
                $pro['Price'] = $v['buyprice'] + $do_rand;
            }
            $is_do_price = 1;
        }
        //没有任何下单记录
        if($up_price == 0 && $down_price == 0 && $is_do_price == 0){
            $is_do_price = 2;
        }
        echo 111111;exit;
        //只有一个人下单，或者所有人下单买的方向相同
        if(( ($up_price == 0 && $down_price != 0) || ($up_price != 0 && $down_price == 0) )  && $is_do_price == 0 ){

            //风控参数
            $chance = $risk["chance"];
            $chance_1 = explode('|',$chance);
            $chance_1 = array_filter($chance_1);
            //循环风控参数
            if(count($chance_1) >= 1){
                foreach ($chance_1 as $key => $value) {
                    //切割风控参数
                    $arr_1 = explode(":",$value);
                    $arr_2 = explode("-",$arr_1[0]);
                    //比较最大买入价格
                    if($max_fee >= $arr_2[0] && $max_fee < $arr_2[1]){
                        //得出风控百分比
                        if(!isset($arr_1[1])){
                            $chance_num = 30;
                        }else{
                            $chance_num = $arr_1[1];
                        }

                        $_rand = rand(1,100);
                        continue;

                    }

                }
            }




            //买涨
            if(isset($_rand) && $up_price != 0){

                if($_rand > $chance_num){	//客损
                    $pro['Price'] = $min_buyprice-$do_rand;

                    // if( abs($pro['Price'] - $_prcie) > $proinfo['point_top']){
                    // 	$pro['Price'] = $_prcie - ($proinfo['point_top'] + rand(100,999)/1000);
                    // }

                    $is_do_price = 1;
                    //echo 5;
                }else{		//客赢
                    $pro['Price'] = $max_buyprice+$do_rand;
                    // if( abs($pro['Price'] - $_prcie) > $proinfo['point_top']){
                    // 	$pro['Price'] = $_prcie + ($proinfo['point_top'] + rand(100,999)/1000);
                    // }
                    $is_do_price = 1;
                    //echo 6;
                }

            }

            if(isset($_rand) && $down_price != 0){

                if($_rand > $chance_num){	//客损
                    $pro['Price'] = $max_buyprice+$do_rand;
                    // if( abs($pro['Price'] - $_prcie) > $proinfo['point_top']){
                    // 	$pro['Price'] = $_prcie + ($proinfo['point_top'] + rand(100,999)/1000);
                    // }
                    $is_do_price = 1;
                    //echo 7;
                }else{		//客赢
                    $pro['Price'] = $min_buyprice-$do_rand;
                    // if( abs($pro['Price'] - $_prcie) > $proinfo['point_top']){
                    // 	$pro['Price'] = $_prcie - ($proinfo['point_top'] + rand(100,999)/1000);
                    // }
                    $is_do_price = 1;
                    //echo 8;
                }

            }



        }

        //多个人下单，并且所有人下单买的方向不相同
        if($up_price != 0 && $down_price != 0  && $is_do_price == 0){
            //买涨大于买跌的
            if ($up_price > $down_price) {
                $pro['Price'] = $min_buyprice-$do_rand;
                $is_do_price = 1;
            }
            //买涨小于买跌的
            if ($up_price < $down_price) {
                $pro['Price'] = $max_buyprice+$do_rand;
                $is_do_price = 1;
            }
            if ($up_price == $down_price) {
                $is_do_price = 2;
            }
        }

        if($is_do_price == 2 || $is_do_price == 0){
            $pro['Price'] = $this->fengkong($pro['Price'],$proinfo);
        }
        $data_info->where('id',$pid)->update($pro);
        return $pro['Price'];
    }
    public function yebeveryday(){
        if($this->request->get('token')=="ABCD484088"){
            $nowtime=time();
            $keepnum=0;
            $closenum=0;
            $nowprift=0;
            $getdoing=Db::table('lc_yuebao_lists')->where('status=1')->select();

            foreach($getdoing as $n=>$v){
                //第一步，计算未到期
                if($v['end_time']>$nowtime){
                    $nowprift=($v['money']*$v['lily']/100/365)*round(($nowtime-$v['start_time'])/86400,1);
                    $nowprift=number_format($nowprift,5);
                    Db::table('lc_yuebao_lists')->where('id='.$v['id'])->update(['nowprofit'=>$nowprift]);
                    $keepnum=$keepnum+1;
                }
                //第二步，已到期待结算
                if($nowtime>$v['end_time']){
                    //更新参保状态。
                    $nowprift=($v['money']*$v['lily']/100/365)*round(($nowtime-$v['start_time'])/86400,1);
                    $nowprift=number_format($nowprift,5);
                    Db::table('lc_yuebao_lists')->where('id='.$v['id'])->update(['status'=>2,'end_time'=>$nowtime,'nowprofit'=>$nowprift]);

                    //获取用户余额；
                    $getuserinfo=Db::table('lc_user')->where('id='.$v['uid'])->find();
                    //记录日志！
                    unset($v['id']);
                    $v['status']=2;
                    $v['end_time']=time();
                    $v['nowprofit']=$nowprift;
                    $v['balance']=$getuserinfo['money'];
                    $v['closetime']=time();
                    $v['remarks']="自动结算";
                    Db::table('lc_yuebao_log')->insert($v);
                    //更新用户余额
                    /*$newbalance=$getuserinfo['money']+$nowprift+$v['money'];
                    Db::table('lc_user')->where('id='.$v['uid'])->update(['money'=>$newbalance]);
                    //更新UC
                    $getuc=Db::table('lc_yuebao_uc')->where('uid='.$v['uid'])->find();
                    Db::table('lc_yuebao_uc')->where('uid='.$v['uid'])->update(['balance'=>$getuc['balance']-$v['money']]);*/
                    $getuc=Db::table('lc_yuebao_uc')->where('uid='.$v['uid'])->find();
                    Db::table('lc_yuebao_uc')->where('uid='.$v['uid'])->update([
                        'balance'=>$getuc['balance']-$v['money'],
                        'trans_balance'=>round($getuc['trans_balance']+$nowprift+$v['money'],1),
                        'totalprofit'=>round($getuc['totalprofit']+$nowprift,1)
                    ]);
                    //记录UCLOG
                    $saveuclog=array(
                        'uid'=>$v['uid'],
                        'balance'=>$getuc['balance'],
                        'money'=>"-".$v['money'],
                        'addtime'=>time(),
                        'remarks'=>$v['yebtitle']."到期结算"
                    );
                    Db::table('lc_yuebao_uclog')->insert($saveuclog);
                    $closenum=$closenum+1;
                }
            }
            //结算完，更新UC

            echo("更新".$keepnum."个记录，结算".$closenum."个记录.");
            return json_encode("ABCD484088");die;
        }
    }
    public function upuceveryday1(){
        if($this->request->get('token')=="ABCD484088"){
            $getalluc=Db::table('lc_yuebao_uc')->where("id > 0")->select();
            foreach($getalluc as $v){
                $res=Db::table('lc_yuebao_uc')->where("uid = ".$v['uid'])->update(['prebalance'=>$v['balance'],'preprofit'=>$v['totalprofit']]);
                var_dump($v,$res);
            }

        }
    }
    public function upuceveryday2(){
        if($this->request->get('token')=="ABCD484088"){
            $getalluc=Db::table('lc_yuebao_uc')->where("id > 0")->select();
            foreach($getalluc as $v){
                $totalprofit=Db::table('lc_yuebao_lists')->where("uid = ".$v['uid'])->sum('nowprofit');
                $res=Db::table('lc_yuebao_uc')->where("uid = ".$v['uid'])->update(['totalprofit'=>round($totalprofit,5)]);
                var_dump($v,$res);
            }

        }
    }
}
