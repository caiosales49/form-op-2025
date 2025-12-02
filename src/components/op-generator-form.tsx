"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, PlusCircle, Trash2, Banknote, User, Loader2, Utensils, Building } from "lucide-react";
import React from "react";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "./ui/separator";
import { useToast } from "@/hooks/use-toast";

const paymentPeriodSchema = z.object({
  startDate: z.date({ required_error: "Data inicial é obrigatória." }),
  endDate: z.date({ required_error: "Data final é obrigatória." }),
  value: z.coerce.number().min(0.01, "O valor deve ser maior que zero."),
});

const formSchema = z.object({
  paymentType: z.enum(["fuel", "food_and_fuel"], {
    required_error: "Você precisa selecionar um tipo de pagamento.",
  }),
  documentType: z.enum(["cpf", "cnpj"], {
    required_error: "Selecione o tipo de documento.",
  }),
  fullName: z.string().min(3, "Nome completo ou Razão Social é obrigatório."),
  document: z.string().min(1, "CPF/CNPJ é obrigatório."),
  bankName: z.string().min(2, "Nome do banco é obrigatório."),
  agency: z.string().min(1, "Agência é obrigatória."),
  account: z.string().min(1, "Conta é obrigatória."),
  paymentPeriods: z.array(paymentPeriodSchema).min(1, "Adicione pelo menos um período de pagamento."),
}).superRefine((data, ctx) => {
  // Validação de Períodos
  data.paymentPeriods.forEach((period, index) => {
    if (period.startDate > period.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Deve ser após a data inicial.`,
        path: [`paymentPeriods`, index, `endDate`],
      });
    }
  });

  // Validação de CPF/CNPJ
  const documentRegex = data.documentType === 'cpf' 
    ? /^\d{3}\.\d{3}\.\d{3}-\d{2}$/ 
    : /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
  if (!documentRegex.test(data.document)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Formato de ${data.documentType.toUpperCase()} inválido.`,
      path: ["document"],
    });
  }
});


export type OpFormValues = z.infer<typeof formSchema>;

interface OpGeneratorFormProps {
  onFormSubmit: (data: OpFormValues) => void;
  isGenerating: boolean;
}

const defaultValues: Partial<OpFormValues> = {
  paymentType: "food_and_fuel",
  documentType: "cpf",
  fullName: "",
  document: "",
  bankName: "",
  agency: "",
  account: "",
  paymentPeriods: [],
};

export function OpGeneratorForm({ onFormSubmit, isGenerating }: OpGeneratorFormProps) {
  const [storedUserDetails, setStoredUserDetails] = useLocalStorage("op-user-details", {
    documentType: "cpf",
    fullName: "",
    document: "",
    bankName: "",
    agency: "",
    account: "",
  });

  const { toast } = useToast();

  const form = useForm<OpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      ...storedUserDetails,
    } as OpFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "paymentPeriods",
  });

  const watchDocumentType = form.watch("documentType");
  const isInitialMount = React.useRef(true);


  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    let formattedValue = value.replace(/\D/g, "");

    if (watchDocumentType === "cpf") {
      formattedValue = formattedValue.slice(0, 11);
      formattedValue = formattedValue.replace(/(\d{3})(\d)/, "$1.$2");
      formattedValue = formattedValue.replace(/(\d{3})(\d)/, "$1.$2");
      formattedValue = formattedValue.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      formattedValue = formattedValue.slice(0, 14);
      formattedValue = formattedValue.replace(/^(\d{2})(\d)/, "$1.$2");
      formattedValue = formattedValue.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      formattedValue = formattedValue.replace(/\.(\d{3})(\d)/, ".$1/$2");
      formattedValue = formattedValue.replace(/(\d{4})(\d)/, "$1-$2");
    }
    
    form.setValue("document", formattedValue, { shouldValidate: true });
  };
  
  React.useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }
    form.setValue("document", "", { shouldValidate: true });
  }, [watchDocumentType, form]);


  const onSubmit = (data: OpFormValues) => {
    const { documentType, fullName, document, bankName, agency, account } = data;
    setStoredUserDetails({ documentType, fullName, document, bankName, agency, account });
    toast({
      title: "Dados salvos!",
      description: "Seus dados foram salvos localmente para uso futuro.",
    });
    onFormSubmit(data);
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Criar Ordem de Pagamento</CardTitle>
        <CardDescription>Preencha os campos abaixo para gerar o documento.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
               <FormField
                control={form.control}
                name="paymentType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-lg font-medium flex items-center gap-2 text-primary"><Utensils /> Tipo de Pagamento</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col md:flex-row gap-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0 p-4 border rounded-md has-[:checked]:border-primary flex-1">
                          <FormControl>
                            <RadioGroupItem value="food_and_fuel" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Alimentação e Combustível
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 p-4 border rounded-md has-[:checked]:border-primary flex-1">
                          <FormControl>
                            <RadioGroupItem value="fuel" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Apenas Combustível
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2 text-primary"><User /> Dados do Beneficiário</h3>

              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de Documento</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="cpf" />
                          </FormControl>
                          <FormLabel className="font-normal">Pessoa Física (CPF)</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                           <FormControl>
                            <RadioGroupItem value="cnpj" />
                          </FormControl>
                          <FormLabel className="font-normal">Pessoa Jurídica (CNPJ)</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo / Razão Social</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome ou da empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{watchDocumentType.toUpperCase()}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={watchDocumentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'} 
                          {...field}
                          onChange={handleDocumentChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <h3 className="text-lg font-medium flex items-center gap-2 mt-4 text-primary"><Banknote /> Dados Bancários</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banco</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do banco" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="agency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agência</FormLabel>
                      <FormControl>
                        <Input placeholder="0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="account"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conta</FormLabel>
                      <FormControl>
                        <Input placeholder="12345-6" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Períodos de Pagamento</h3>
              {fields.map((item, index) => (
                <div key={item.id} className="flex flex-col md:flex-row items-start md:items-end gap-4 p-4 border rounded-lg relative bg-background/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
                    <FormField
                      control={form.control}
                      name={`paymentPeriods.${index}.startDate`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data Inicial</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal bg-card",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: ptBR })
                                  ) : (
                                    <span>Escolha uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`paymentPeriods.${index}.endDate`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data Final</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal bg-card",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: ptBR })
                                  ) : (
                                    <span>Escolha uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name={`paymentPeriods.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="w-full md:w-48">
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="100.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="md:static absolute top-2 right-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remover período</span>
                  </Button>
                </div>
              ))}
                {form.formState.errors.paymentPeriods?.root && <FormMessage>{form.formState.errors.paymentPeriods.root.message}</FormMessage>}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ startDate: new Date(), endDate: new Date(), value: 100 })}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Período
            </Button>

            <Button type="submit" className="w-full text-lg py-6" disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {isGenerating ? "Gerando PDF..." : "Gerar Ordem de Pagamento"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
