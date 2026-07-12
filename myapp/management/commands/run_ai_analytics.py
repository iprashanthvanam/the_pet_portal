import re
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Sum, Count
from django.conf import settings
from google import genai
from myapp.models import (
    Order, OrderItem, DoctorAppointment, PetCareBooking, GroomingBooking, Accessory, AICachedReport
)

class Command(BaseCommand):
    help = "Aggregates, anonymizes and caches AI analytics once a week."

    def handle(self, *args, **options):
        self.stdout.write("Running AI Analytics Aggregation...")

        # 1. Aggregates
        total_orders = Order.objects.count()
        total_revenue = Order.objects.filter(payment_status="PAID").aggregate(
            revenue=Sum("total_cost")
        )["revenue"] or 0

        total_refunds = Order.objects.filter(payment_status="REFUNDED").count()
        grooming_count = GroomingBooking.objects.count()
        petcare_count = PetCareBooking.objects.count()
        appointment_count = DoctorAppointment.objects.count()
        cancelled_orders = Order.objects.filter(status="CANCELLED").count()

        top_items = list(
            OrderItem.objects
            .values("product_name")
            .annotate(total_qty=Sum("quantity"))
            .order_by("-total_qty")[:5]
        )

        low_stock = list(Accessory.objects.filter(stock__lt=5).order_by("stock").values_list('name', flat=True))

        peak_hours = list(
            DoctorAppointment.objects
            .values("appointment_time")
            .annotate(count=Count("id"))
            .order_by("-count")[:3]
        )

        # Monthly growth calculation
        now = timezone.now()
        last_month = now - timedelta(days=30)
        current_month_revenue = Order.objects.filter(
            created_at__gte=last_month,
            payment_status="PAID"
        ).aggregate(total=Sum("total_cost"))["total"] or 0

        previous_month = last_month - timedelta(days=30)
        previous_month_revenue = Order.objects.filter(
            created_at__range=(previous_month, last_month),
            payment_status="PAID"
        ).aggregate(total=Sum("total_cost"))["total"] or 0

        growth_rate = 0
        if previous_month_revenue > 0:
            growth_rate = ((current_month_revenue - previous_month_revenue) / previous_month_revenue) * 100

        # Anonymization Pipeline (SPI/PII sanitization wrapper)
        raw_summary = f"""
Total Orders: {total_orders}
Total Revenue: INR {total_revenue}
Total Refunds: {total_refunds}
Cancelled Orders: {cancelled_orders}
Grooming Bookings: {grooming_count}
Pet Care Bookings: {petcare_count}
Doctor Appointments: {appointment_count}
Current Month Revenue: INR {current_month_revenue}
Previous Month Revenue: INR {previous_month_revenue}
Growth Rate: {growth_rate:.2f}%
Top Selling Items: {top_items}
Low Stock Accessories: {low_stock}
Peak Booking Hours: {peak_hours}
"""
        # Strict PII/SPI Regex Replacement
        anonymized_summary = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[REDACTED_EMAIL]', raw_summary)
        anonymized_summary = re.sub(r'\+?\d[\d -]{8,12}\d', '[REDACTED_PHONE]', anonymized_summary)
        anonymized_summary = re.sub(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', '[REDACTED_CARD]', anonymized_summary)

        # 2. Call AI API
        ai_insights = "AI analysis temporarily unavailable."
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            ai_prompt = f"""
You are a Business Intelligence AI.
Analyze the following business metrics and generate:
1. Best performing service
2. Worst performing service
3. Revenue trend analysis
4. Refund risk detection
5. Cancellation risk
6. Business recommendations
7. Growth forecast insight

DATA:
{anonymized_summary}

Keep response professional, highly structured, and strictly format as clean HTML tags or Markdown.
"""
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=ai_prompt,
            )
            ai_insights = response.text
        except Exception as e:
            self.stderr.write(f"Gemini API Error: {str(e)}")

        # 3. Store in Database
        report_data = {
            "total_orders": total_orders,
            "total_revenue": float(total_revenue),
            "total_refunds": total_refunds,
            "cancelled_orders": cancelled_orders,
            "grooming_count": grooming_count,
            "petcare_count": petcare_count,
            "appointment_count": appointment_count,
            "growth_rate": round(growth_rate, 2),
            "top_items": top_items,
            "low_stock": low_stock,
            "peak_hours": [str(p['appointment_time']) for p in peak_hours],
            "ai_insights": ai_insights,
            "generated_at": timezone.now().isoformat()
        }

        AICachedReport.objects.create(report_data=report_data)
        self.stdout.write(self.style.SUCCESS("Successfully aggregated and cached AI insights report!"))
