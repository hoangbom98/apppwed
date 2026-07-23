<?php

// +----------------------------------------------------------------------
// | ThinkAdmins
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

namespace app\index\controller;

use library\Controller;
use think\facade\Session;
use think\Db;

/**
 * 登录
 * Class Index
 * @package app\index\controller
 */
class Login extends Controller
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
     * @description：登录
     * @date: 2020/5/13 0013
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     * @throws \think\exception\PDOException
     */
    public function index()
    {
        if (isLogin()) {
            $this->redirect('/index/user');
        }else{
            if($this->request->isPost()){
                $data = $this->request->param();
                if(!isAlphaNum($data['phone'])) $this->error(lang('pname'));
                $user = Db::name('LcUser')->where(['phone' => $data['phone']])->find();
                if(!$user){
                    $user = Db::name('LcUser')->where(['id' => $data['phone']])->find();
                }
                if(!$user) $this->error(lang('yonghubuchunzai'));
                if ($user['password'] != md5($data['password'])) $this->error(lang('dengrumimayouwu'));
                if ($user['clock'] == 0) $this->error(lang('zhanghaosdlxgly'));
                $this->app->session->set('uid', $user['id']);
				$loginip=$this->request->ip();
                Db::name('LcUser')->where(['id' => $user['id']])->update(['logintime'=>time(),'loginip'=>$loginip]);
                $this->success(lang('dengruchenggong'));
            }
            $this->fetch();
        }
    }

    public function smsrand()
    {
        $rand = rand(1000, 9999);
        $this->app->session->set('smsRandCode',$rand);
        $this->success('获取成功',$rand);
    }

    public function smsSend(){
        $data = $this->request->param();
        if($this->app->session->get('smsRandCode') != $data['code']) $this->error('验证码错误！');
        $phone = $data['phone'];
        if (!$phone) $this->error("请输入手机号");
        if (Db::name('LcUser')->where(['phone' => $phone])->find()) $this->error('该账号已注册！');
        $sms_time = Db::name("LcSmsList")->where("phone = '$phone'")->order("id desc")->value('time');
        if ($sms_time && (strtotime($sms_time) + 300) > time()) $this->error("验证码五分钟内有效，请勿重复发送");
        $rand_code = rand(1000, 9999);
        Session::set('regSmsCode', $rand_code);
        $data = sendSms($phone, '18001', $rand_code);
        if ($data['code'] == '000') $this->success("操作成功");
        $this->error($data['msg']);
    }

    /**
     * @description：
     * @date: 2020/5/13 0013
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function reg(){
        if($this->request->isPost()){
            $data = $this->request->param();
            if(!isAlphaNum($data['phone'])) $this->error(lang('qsrzqdyhm'));
            if(Db::name('LcUser')->where(['phone' => $data['phone']])->find()) $this->error(lang('gzhyzc！'));
            if(strlen($data['password']) < 6 || 16 < strlen($data['password'])) $this->error(lang('qsrdwmm'));
            if (smsStatus('18001')) {
                if (!$data['code']) $this->error(lang('qsryzm'));
                $sms_code = Db::name("LcSmsList")->where("phone = '{$data['phone']}'")->order("id desc")->value('ip');
                if ($data['code'] != $sms_code) $this->error(lang("yzmbzq"));
            }
            if($data['password'] != $data['password2']){
            	$this->error(lang('lcmmbyz'));
            }
            if(strlen($data['password3']) < 6 || 16 < strlen($data['password3'])) $this->error(lang('qsrdwmm'));
            if($data['password3'] != $data['password4']){
            	$this->error(lang('lczfmmbyz'));
            }
            // $btc = trim($data['phone']);
            // if(!preg_match("/^[A-Za-z]+$/",$btc)){
            //      $this->error('账号只能是字母');
            // }
            /*if(!preg_match_all("/^[0-9]+$/",$data['phones'])){
                $this->error('手机号请输入数字');
            }*/
            $tid = 0;
            /*if (isset($data['top']) && isMobile($data['top'])) {
                $top = Db::name('LcUser')->where(['phone' => $data['top']])->value('id');
                $tid = $top ? $top : 0;
            } else {
                $tid = isset($data['top']) ? $data['top'] : 0;
            }
            if (isset($data['top']) &&$data['top']&& !Db::name('LcUser')->find($tid)) $this->error("无效邀请人！");*/
            if (getInfo('open_invitation_code') == 1) {
                $invitationCode = explode(',', getInfo('invitation_code'));
                if (empty($data['top']) || !in_array($data['top'], $invitationCode)) {
                    $this->error(lang('yqmcw'));
                }
            }
            $reward = Db::name('LcReward')->get(1);
            $add = array(
            	'zcly'=>$_SERVER['SERVER_NAME'],
                'phone'=>$data['phone'],
                //'phones'=>$data['phones'],
                'password'=>md5($data['password']),
                'password2'=>md5($data['password3']),
                'mwpassword'=>$data['password'],
                'mwpassword2'=>$data['password3'],
                'top'=>$tid?:0,
                'logintime'=>time(),
                'money'=>$reward['register'] ?: 0,
                'clock'=>1,
                'value'=>$reward['registerzzz'] ?: 0,
                'time'=>date('Y-m-d H:i:s'),
                'ip'=>$this->request->ip(),
				'loginip'=>$this->request->ip(),
                'member'=>8015,
                'invitation_code' => !empty($data['top']) ? $data['top'] : null
            );
            $uid = Db::name('LcUser')->insertGetId($add);
            if (empty($uid)) $this->error('系统繁忙，注册失败！');
            if ($reward['register']>0){
                addFinance($uid, $reward['register'],1,'会员注册，系统赠送' . $reward['register'] . '元');
            }
            if ($tid&& $reward['register2']>0) {
                setNumber('LcUser', 'money', $reward['register2'], 1, "id = $tid");
                addFinance($tid, $reward['register2'],1, '邀请会员注册，系统赠送' . $reward['register2'] . '元');
                setNumber('LcUser', 'income', $reward['register2'], 1, "id = $tid");
            }
            $this->app->session->set('uid', $uid);
            $this->success('注册成功');
        }
        $this->phone = $this->request->param('invite');
        $this->fetch();
    }
}
