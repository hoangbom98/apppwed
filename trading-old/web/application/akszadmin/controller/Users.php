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
 * 会员管理
 * Class Item
 * @package app\akszadmin\controller
 */
class Users extends Controller
{
    /**
     * 绑定数据表
     * @var string
     */
    protected $table = 'LcUser';

    /**
     * 会员列表
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
        $this->title = '会员列表';
        $query = $this->_query($this->table)->alias('u')->field('u.*,m.name as m_name');
        if (input('get.online_user/d') === 1) {
            $query->order('u.access_time', 'desc');
        }
        $query->join('lc_user_member m',
            'u.member=m.id')->equal('u.auth#u_auth,u.clock#u_clock,u.member#u_member')->like('u.ip#i_orderid,u.id#u_id,u.name#u_name,u.ip#u_ip')->dateBetween('u.time#u_time')->order('u.id desc')->page();
    }

    /**
     * 状态 开启或者关闭
     * @auth true
     * @throws \think\Exception
     * @throws \think\exception\PDOException
     */
    public function iskqopen()
    {

        $id = $this->request->param('id');
        $iskq = $this->request->param('iskq');
        $this->_save($this->table, ['isjy' => $iskq]);
    }

    /**
     * 数据列表处理
     * @param array $data
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    protected function _index_page_filter(&$data)
    {
        $this->member = Db::name("lc_user_member")->field('id,name')->select();
        $ip = new \Ip2Region();
        foreach ($data as &$vo) {
            $vo['online'] = $vo['access_time'] > (time() - 300) ? 1 : 0;
            $vo['top'] = Db::name("lc_user")->where("id = {$vo['top']}")->value('phone');
            $vo['cash_sum'] = Db::name("lc_cash")->where("uid = {$vo['id']} AND status = '1'")->sum('money');
            $vo['recharge_sum'] = Db::name("lc_recharge")->where("uid = {$vo['id']} AND status = '1'")->sum('money');
            $vo['invest_sum'] = Db::name('lc_invest')->where("uid = {$vo['id']}")->sum('money');
            $vo['wait_invest'] = Db::name('lc_invest_list')->where("uid = {$vo['id']} AND pay1 > 0 AND status = 0")->sum('money1');
            $vo['wait_money'] = Db::name('lc_invest_list')->where("uid = {$vo['id']} AND money2 > 0 AND status = 0")->sum('money2');
            $result = $ip->btreeSearch($vo['ip']);
            $vo['isp'] = isset($result['region']) ? $result['region'] : '';
            $vo['isp'] = str_replace(['内网IP', '0', '|'], '', $vo['isp']);
            $result2 = $ip->btreeSearch($vo['loginip']);
            $vo['isp2'] = isset($result2['region']) ? $result2['region'] : '';
            $vo['isp2'] = str_replace(['内网IP', '0', '|'], '', $vo['isp2']);
        }
    }

    public function user_relation()
    {
        $this->title = '会员关系网';
        if ($this->request->isGet()) {
            $list = [];
            $phone = $this->request->param('phone');
            $type = $this->request->param('type');
            if ($type == 1) {
                $top = Db::name('LcUser')->where(['phone' => $phone])->value('top');
                if ($top) {
                    $list = Db::name('LcUser')->where(['id' => $top])->select();
                }
            } else {
                $uid = Db::name('LcUser')->where(['phone' => $phone])->value('id');
                if ($uid) {
                    $list = Db::name('LcUser')->where(['top' => $uid])->select();
                }
            }
            if ($list) {
                foreach ($list as &$v) {
                    $vo['top_phone'] = '';
                    if ($v['top']) {
                        $vo['top_phone'] = Db::name('LcUser')->where(['id' => $v['top']])->value('phone');
                    }
                }
            }
            $this->assign('list', $list);
        }
        $this->fetch();
    }

    /**
     * 表单数据处理
     * @param array $data
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function _form_filter(&$vo){
        if ($this->request->isPost()) {
            $isOperationMoney = request()->action() === 'operationmoney';
            if (!$isOperationMoney) {
                if ($vo['mwpassword']) {
                    $vo['password'] = md5($vo['mwpassword']);
                }
                if ($vo['mwpassword2']) {
                    $vo['password2'] = md5($vo['mwpassword2']);
                }
            }
            if (isset($vo['id'])) {
                $money = Db::name($this->table)->where("id = {$vo['id']}")->value('money');
                if ($isOperationMoney) {
                    $type = $this->request->param('type');
                    $moneys = $vo['money'];
                    if ($type == 0) {
                        $vo['money'] += $money;
                        $type = 1;
                    } else {
                        $vo['money'] = $money - $vo['money'];
                        $type = 2;
                    }
                    model('akszadmin/Users')->addFinance($vo['id'], abs($moneys), $type, '系统操作');
                }
                if (!$isOperationMoney && $money && $money != $vo['money']) {
                    $handle_money = $money - $vo['money'];
                    $type = $handle_money > 0 ? 2 : 1;
                    model('akszadmin/Users')->addFinance($vo['id'], abs($handle_money), $type, '系统操作');
                }
                if (!empty($vo['bank'])) {
                    Db::name("LcBank")->where('uid', $vo['id'])->update([
                        'bank' => $vo['bank'],
                        'area' => $vo['area'],
                        'account' => $vo['account']
                    ]);
                }

            } else {
                $vo['time'] = date('Y-m-d H:i:s');
            }
        } else {
            if (!isset($vo['auth'])) {
                $vo['auth'] = '0';
            }
            $this->member = Db::name("LcUserMember")->order('id desc')->select();

        }
    }

    /**
     * 添加用户
     * @auth true
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     * @throws \think\exception\PDOException
     */
    public function add()
    {
        $this->applyCsrfToken();
        $this->_form($this->table, 'form');
    }

    /**
     * 编辑用户
     * @auth true
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     * @throws \think\exception\PDOException
     */
    public function edit()
    {
        $this->applyCsrfToken();

        $uid = $this->request->param('id');

        $this->bankinfo = Db::name("LcBank")->where("uid = {$uid}")->order('id desc')->find();

        $this->_form($this->table, 'form');
    }

    /**
     * 禁用用户
     * @auth true
     * @throws \think\Exception
     * @throws \think\exception\PDOException
     */
    public function forbid()
    {
        $this->applyCsrfToken();
        $this->_save($this->table, ['clock' => '0']);
    }

    /**
     * 启用用户
     * @auth true
     * @throws \think\Exception
     * @throws \think\exception\PDOException
     */
    public function resume()
    {
        $this->applyCsrfToken();
        $this->_save($this->table, ['clock' => '1']);
    }

    public function setrobot()
    {
        $this->applyCsrfToken();
        $this->_save($this->table, ['robot' => $_POST['clock']]);
    }

    /**
     * 删除用户
     * @auth true
     * @throws \think\Exception
     * @throws \think\exception\PDOException
     */
    public function remove()
    {
        $this->applyCsrfToken();
        $this->_delete($this->table);
    }
    public function operationMoney() {
        $this->applyCsrfToken();
        $this->name = $this->request->param('type') == 0 ? '充值' : '扣款';
        $this->_form($this->table, 'operation_money');
    }
}
