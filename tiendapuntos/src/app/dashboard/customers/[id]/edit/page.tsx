import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditCustomerForm } from "@/components/customer/EditCustomerForm";

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  const t = await getTranslations("customers");
  const session = (await getSession())!;
  const customer = await prisma.customer.findFirst({
    where: { id: params.id, businessId: session.businessId },
  });

  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href={`/dashboard/customers/${customer.id}`}
          className="text-sm text-gray-500 hover:underline"
        >
          {t("backToCustomer")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{t("editTitle")}</h1>
      </div>
      <EditCustomerForm customer={customer} />
    </div>
  );
}
