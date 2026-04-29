import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Modal, Form, Input, Select, InputNumber, message, Space, Popconfirm, DatePicker } from 'antd';
import { PlusOutlined, ReloadOutlined, UserOutlined, WalletOutlined } from '@ant-design/icons';
import { userApi } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();
  const [rechargeForm] = Form.useForm();

  const creditLevelNames = {
    EXCELLENT: '优秀',
    GOOD: '良好',
    FAIR: '一般',
    POOR: '较差',
  };

  const creditLevelColors = {
    EXCELLENT: 'green',
    GOOD: 'blue',
    FAIR: 'orange',
    POOR: 'red',
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      key: 'realName',
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '驾照号',
      dataIndex: 'licenseNumber',
      key: 'licenseNumber',
    },
    {
      title: '驾照签发日期',
      dataIndex: 'licenseIssueDate',
      key: 'licenseIssueDate',
      render: (date) => date,
    },
    {
      title: '信用等级',
      dataIndex: 'creditLevel',
      key: 'creditLevel',
      render: (level) => (
        <Tag color={creditLevelColors[level]}>
          {creditLevelNames[level] || level}
        </Tag>
      ),
    },
    {
      title: '余额(元)',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>¥{balance}</span>,
    },
    {
      title: '违章次数',
      dataIndex: 'violationCount',
      key: 'violationCount',
    },
    {
      title: '逾期次数',
      dataIndex: 'overdueCount',
      key: 'overdueCount',
    },
    {
      title: '黑名单',
      dataIndex: 'isBlacklisted',
      key: 'isBlacklisted',
      render: (isBlacklisted) => (
        <Tag color={isBlacklisted ? 'red' : 'green'}>
          {isBlacklisted ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            icon={<WalletOutlined />}
            onClick={() => handleRecharge(record)}
          >
            充值
          </Button>
          <Popconfirm
            title={record.isBlacklisted ? '确定要移出黑名单吗？' : '确定要加入黑名单吗？'}
            onConfirm={() => handleToggleBlacklist(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger={!record.isBlacklisted}>
              {record.isBlacklisted ? '移出黑名单' : '加入黑名单'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getAll();
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const submitData = {
        ...values,
        licenseIssueDate: values.licenseIssueDate?.format('YYYY-MM-DD'),
        creditLevel: 'EXCELLENT',
        balance: 0,
        isBlacklisted: false,
        violationCount: 0,
        overdueCount: 0,
      };
      
      const response = await userApi.create(submitData);
      if (response.data.success) {
        message.success('用户添加成功');
        setModalVisible(false);
        loadUsers();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('添加用户失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRecharge = (user) => {
    setSelectedUser(user);
    rechargeForm.resetFields();
    setRechargeModalVisible(true);
  };

  const handleRechargeSubmit = async (values) => {
    try {
      const response = await userApi.recharge(selectedUser.id, values.amount);
      if (response.data.success) {
        message.success('充值成功');
        setRechargeModalVisible(false);
        loadUsers();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('充值失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleBlacklist = async (userId) => {
    try {
      const response = await userApi.toggleBlacklist(userId);
      if (response.data.success) {
        message.success('黑名单状态更新成功');
        loadUsers();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('操作失败: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <Card
        title={<span><UserOutlined /> 用户管理</span>}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadUsers}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加用户
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title="添加用户"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="例如：zhangsan" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item
            name="realName"
            label="真实姓名"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input placeholder="例如：张三" />
          </Form.Item>
          <Form.Item
            name="idCard"
            label="身份证号"
            rules={[{ required: true, message: '请输入身份证号' }]}
          >
            <Input placeholder="例如：110101199001011234" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input placeholder="例如：13800138001" />
          </Form.Item>
          <Form.Item
            name="licenseNumber"
            label="驾照号"
            rules={[{ required: true, message: '请输入驾照号' }]}
          >
            <Input placeholder="例如：A12345678" />
          </Form.Item>
          <Form.Item
            name="licenseIssueDate"
            label="驾照签发日期"
            rules={[{ required: true, message: '请选择驾照签发日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="账户充值"
        open={rechargeModalVisible}
        onCancel={() => setRechargeModalVisible(false)}
        onOk={() => rechargeForm.submit()}
      >
        <div style={{ marginBottom: '16px' }}>
          <p>用户：<strong>{selectedUser?.realName}</strong></p>
          <p>当前余额：<strong style={{ color: '#1890ff' }}>¥{selectedUser?.balance}</strong></p>
        </div>
        <Form
          form={rechargeForm}
          layout="vertical"
          onFinish={handleRechargeSubmit}
        >
          <Form.Item
            name="amount"
            label="充值金额(元)"
            rules={[
              { required: true, message: '请输入充值金额' },
              { type: 'number', min: 1, message: '充值金额必须大于0' },
            ]}
          >
            <InputNumber min={1} precision={2} style={{ width: '100%' }} placeholder="请输入充值金额" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
