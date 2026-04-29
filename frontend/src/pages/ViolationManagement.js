import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Tag, Button, Modal, Form, Input, Select, InputNumber, 
  message, Space, DatePicker, Descriptions, Divider 
} from 'antd';
import { PlusOutlined, ReloadOutlined, WarningOutlined, CarOutlined } from '@ant-design/icons';
import { violationApi, carApi } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const ViolationManagement = () => {
  const [violations, setViolations] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [form] = Form.useForm();

  const violationStatusNames = {
    PENDING: '待处理',
    PAID: '已缴纳',
    DISPUTED: '有争议',
  };

  const violationStatusColors = {
    PENDING: 'orange',
    PAID: 'green',
    DISPUTED: 'red',
  };

  const columns = [
    {
      title: '车牌号',
      dataIndex: ['car', 'plateNumber'],
      key: 'plateNumber',
      render: (text, record) => (
        <span>
          {record.car?.plateNumber}
          <br />
          <Tag size="small">{record.car?.brand} {record.car?.model}</Tag>
        </span>
      ),
    },
    {
      title: '相关用户',
      dataIndex: ['user', 'realName'],
      key: 'user',
      render: (text) => text || '-',
    },
    {
      title: '相关订单',
      dataIndex: ['rentalOrder', 'orderNumber'],
      key: 'orderNumber',
      render: (text) => text || '-',
    },
    {
      title: '违章时间',
      dataIndex: 'violationTime',
      key: 'violationTime',
      render: (time) => time && dayjs(time).format('YYYY-MM-DD HH:mm'),
      width: 160,
    },
    {
      title: '违章地点',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '违章类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '罚款金额',
      dataIndex: 'fineAmount',
      key: 'fineAmount',
      render: (amount) => <span style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{amount}</span>,
    },
    {
      title: '扣分',
      dataIndex: 'penaltyPoints',
      key: 'penaltyPoints',
      render: (points) => <span style={{ color: '#fa8c16' }}>{points}分</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={violationStatusColors[status]}>
          {violationStatusNames[status] || status}
        </Tag>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (source) => source || '-',
    },
    {
      title: '缴纳时间',
      dataIndex: 'paidTime',
      key: 'paidTime',
      render: (time) => time ? dayjs(time).format('MM-DD HH:mm') : '-',
      width: 140,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => showDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [carsRes] = await Promise.all([
        carApi.getAll(),
      ]);
      if (carsRes.data.success) setCars(carsRes.data.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const showImport = () => {
    form.resetFields();
    setImportModalVisible(true);
  };

  const showDetail = (violation) => {
    setSelectedViolation(violation);
    setDetailModalVisible(true);
  };

  const handleImport = async (values) => {
    try {
      const submitData = {
        ...values,
        violationTime: values.violationTime?.toISOString(),
      };
      
      const response = await violationApi.import(submitData);
      if (response.data.success) {
        message.success('违章导入成功，已自动关联相关订单并从押金扣除罚款');
        setImportModalVisible(false);
        loadData();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('导入失败: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <Card
        title={<span><WarningOutlined /> 违章管理</span>}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={showImport}>
              导入违章
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={violations}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1500 }}
        />
        
        <Divider>违章导入说明</Divider>
        <div style={{ background: '#fffbe6', padding: '16px', borderRadius: '8px' }}>
          <h4>违章导入流程：</h4>
          <ol>
            <li>输入违章车辆的车牌号</li>
            <li>系统会自动查找该时间段内的租赁订单</li>
            <li>自动关联相关用户和订单</li>
            <li>从订单押金中自动扣除罚款金额</li>
            <li>用户违章计数+1，可能影响信用等级</li>
          </ol>
          <h4 style={{ marginTop: '16px' }}>信用等级影响：</h4>
          <ul>
            <li>每1次违章 +1分</li>
            <li>每1次逾期还车 +2分</li>
            <li>总分 >= 3分 → 信用等级降为"一般"</li>
            <li>总分 >= 5分 → 信用等级降为"较差"，加入黑名单</li>
          </ul>
        </div>
      </Card>

      <Modal
        title="导入违章记录"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleImport}
        >
          <Form.Item
            name="plateNumber"
            label="车牌号"
            rules={[{ required: true, message: '请输入车牌号' }]}
          >
            <Select 
              placeholder="请选择或输入车牌号"
              showSearch
              allowClear
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {cars.map(car => (
                <Option key={car.id} value={car.plateNumber}>
                  {car.plateNumber} - {car.brand} {car.model}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="violationTime"
            label="违章时间"
            rules={[{ required: true, message: '请选择违章时间' }]}
          >
            <DatePicker 
              showTime 
              style={{ width: '100%' }}
              placeholder="请选择违章时间"
            />
          </Form.Item>
          <Form.Item
            name="location"
            label="违章地点"
            rules={[{ required: true, message: '请输入违章地点' }]}
          >
            <Input placeholder="例如：朝阳区建国路与国贸桥交叉口" />
          </Form.Item>
          <Form.Item
            name="type"
            label="违章类型"
            rules={[{ required: true, message: '请输入违章类型' }]}
          >
            <Select placeholder="请选择违章类型">
              <Option value="超速行驶">超速行驶</Option>
              <Option value="闯红灯">闯红灯</Option>
              <Option value="违规停车">违规停车</Option>
              <Option value="违章变道">违章变道</Option>
              <Option value="不按规定让行">不按规定让行</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="fineAmount"
            label="罚款金额(元)"
            rules={[
              { required: true, message: '请输入罚款金额' },
              { type: 'number', min: 0, message: '罚款金额必须大于等于0' },
            ]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="例如：200" />
          </Form.Item>
          <Form.Item
            name="penaltyPoints"
            label="扣分"
            rules={[
              { required: true, message: '请输入扣分' },
              { type: 'number', min: 0, message: '扣分必须大于等于0' },
            ]}
          >
            <InputNumber min={0} max={12} precision={0} style={{ width: '100%' }} placeholder="例如：3" />
          </Form.Item>
          <Form.Item name="source" label="违章来源">
            <Input placeholder="例如：交警现场执法、电子眼" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="违章详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedViolation && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="车牌号" span={2}>
                {selectedViolation.car?.plateNumber}
              </Descriptions.Item>
              <Descriptions.Item label="车辆信息">
                {selectedViolation.car?.brand} {selectedViolation.car?.model}
              </Descriptions.Item>
              <Descriptions.Item label="相关用户">
                {selectedViolation.user?.realName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="相关订单">
                {selectedViolation.rentalOrder?.orderNumber || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={violationStatusColors[selectedViolation.status]}>
                  {violationStatusNames[selectedViolation.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="违章时间" span={2}>
                {dayjs(selectedViolation.violationTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="违章地点" span={2}>
                {selectedViolation.location}
              </Descriptions.Item>
              <Descriptions.Item label="违章类型">
                {selectedViolation.type}
              </Descriptions.Item>
              <Descriptions.Item label="罚款金额">
                <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                  ¥{selectedViolation.fineAmount}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="扣分">
                <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>
                  {selectedViolation.penaltyPoints}分
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="缴纳时间">
                {selectedViolation.paidTime 
                  ? dayjs(selectedViolation.paidTime).format('YYYY-MM-DD HH:mm:ss') 
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="来源">
                {selectedViolation.source || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {selectedViolation.remark || '-'}
              </Descriptions.Item>
            </Descriptions>
            
            <Divider>违章处理说明</Divider>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <p><strong>自动处理规则：</strong></p>
              <ul>
                <li>导入违章时，系统自动查找该时间段内的租赁订单</li>
                <li>找到相关订单后，从订单押金中扣除罚款金额</li>
                <li>如果押金不足，记录为待处理状态</li>
                <li>用户违章计数+1，信用等级可能下降</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ViolationManagement;
