namespace HiPrintTest.Models
{
    public class Order
    {
        public string? 订单类型 { get; set; }

        public string? 订单号 { get; set; }

        public string? 客户编号 { get; set; }

        public string? 客户名称 { get; set; }

        public decimal? 总价 { get; set; }

        public DateTime 业务日期 { get; set; }

        public OrderItem[] 订单明细 { get; set; }
    }

    public class OrderItem
    {
        public string? 产品编号 { get; set; }

        public string? 产品名称 { get; set; }

        public int 数量 { get; set; }
    }

}
