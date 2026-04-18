"use client";

import React, { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, useAnimation, useScroll, useTransform } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Sparkles,
  Zap,
  Lock,
  FileAudio,
  Phone,
  Mail,
  MapPin,
  IdCard,
  Hash,
  Users,
  Building2,
  Mic,
  Clock,
  ArrowRight,
  ChevronRight,
  Gauge,
  Cloud,
  Headphones,
} from "lucide-react";

// ------------------------------
// 1. Custom UI Components
// ------------------------------

const AnimatedSection = ({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const controls = useAnimation();

  const getInitial = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: 50 };
      case "down":
        return { opacity: 0, y: -50 };
      case "left":
        return { opacity: 0, x: -50 };
      case "right":
        return { opacity: 0, x: 50 };
      default:
        return { opacity: 0 };
    }
  };

  const getAnimate = () => {
    switch (direction) {
      case "up":
        return { opacity: 1, y: 0 };
      case "down":
        return { opacity: 1, y: 0 };
      case "left":
        return { opacity: 1, x: 0 };
      case "right":
        return { opacity: 1, x: 0 };
      default:
        return { opacity: 1 };
    }
  };

  useEffect(() => {
    if (isInView) {
      controls.start(getAnimate());
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial={getInitial()}
      animate={controls}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const FeatureCard = ({ title, description, icon: Icon, delay = 0 }) => {
  return (
    <AnimatedSection delay={delay} direction="up">
      <div className="group p-6 bg-custom-bg-secondary/40 backdrop-blur-sm rounded-[--radius-card] shadow-md hover:shadow-xl transition-all duration-300 border border-custom-secondary/10 hover:border-custom-accent/30 cursor-pointer h-full">
        <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-custom-accent/10 text-custom-accent group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-custom-main mb-2">{title}</h3>
        <p className="text-custom-secondary">{description}</p>
      </div>
    </AnimatedSection>
  );
};

const ProcessStep = ({ number, title, description, delay = 0 }) => {
  return (
    <AnimatedSection delay={delay} direction="up">
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-custom-accent/10 text-custom-accent text-2xl font-bold border-2 border-custom-accent/30">
          {number}
        </div>
        <h3 className="text-xl font-semibold text-custom-main mb-2">{title}</h3>
        <p className="text-custom-secondary max-w-xs">{description}</p>
      </div>
    </AnimatedSection>
  );
};

const ParallaxBackground = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -400]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute top-20 left-[10%] w-72 h-72 bg-custom-accent/5 rounded-full blur-3xl"
        style={{ y: y1, opacity }}
      />
      <motion.div
        className="absolute bottom-20 right-[5%] w-96 h-96 bg-custom-accent/5 rounded-full blur-3xl"
        style={{ y: y2, opacity }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-custom-accent/3 rounded-full blur-3xl"
        style={{ opacity }}
      />
    </div>
  );
};

// ------------------------------
// 2. Main Page Component
// ------------------------------

export default function Home() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.5]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleRegister = () => {
    router.push("/register");
  };

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden">
      <ParallaxBackground />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          style={{ scale: heroScale, opacity: heroOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-custom-accent/10 rounded-full px-4 py-2 mb-6"
          >
            <Sparkles className="w-4 h-4 text-custom-accent" />
            <span className="text-sm text-custom-accent font-medium">
              Ваша конфиденциальность — наш приоритет
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-custom-main mb-6 leading-tight"
          >
            Защита голосовых данных{" "}
            <span className="text-custom-accent">с ИИ</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-custom-secondary mb-8 max-w-2xl mx-auto"
          >
            Автоматическое обнаружение и удаление персональных данных из аудиозаписей.
            Полная анонимизация с сохранением смысла разговора.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={handleRegister}
              className="btn btn-primary gap-2 px-8 py-3 text-lg"
              style={{ borderRadius: "var(--radius-button)" }}
            >
              Зарегистрироваться
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="btn btn-secondary gap-2 px-8 py-3 text-lg"
              style={{ borderRadius: "var(--radius-button)" }}
            >
              Узнать больше
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 flex flex-wrap gap-6 justify-center text-custom-secondary"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-custom-accent" />
              <span>GDPR Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-custom-accent" />
              <span>Безопасное хранение</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-custom-accent" />
              <span>Мгновенная обработка</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection direction="up" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-custom-main mb-4">
              Как это работает
            </h2>
            <p className="text-custom-secondary max-w-2xl mx-auto">
              Четыре простых шага для полной анонимизации ваших аудиоданных
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <ProcessStep number="1" title="Загрузка аудио" description="Загрузите аудиофайл или укажите поток RTP" delay={0.1} />
            <ProcessStep number="2" title="Распознавание речи" description="ИИ превращает речь в текст с высокой точностью" delay={0.2} />
            <ProcessStep number="3" title="Детекция PII" description="Автоматическое обнаружение персональных данных" delay={0.3} />
            <ProcessStep number="4" title="Анонимизация" description="Удаление или маскировка конфиденциальной информации" delay={0.4} />
          </div>

          <AnimatedSection delay={0.5} direction="up" className="text-center mt-12">
            <button
              onClick={handleRegister}
              className="btn btn-primary gap-2"
              style={{ borderRadius: "var(--radius-button)" }}
            >
              Попробовать бесплатно
              <ArrowRight className="w-4 h-4" />
            </button>
          </AnimatedSection>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-custom-bg-secondary/20">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection direction="up" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-custom-main mb-4">
              Ключевые возможности
            </h2>
            <p className="text-custom-secondary max-w-2xl mx-auto">
              Всё, что нужно для защиты конфиденциальных данных в голосовых каналах
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Многоязычная поддержка"
              description="Распознавание и анонимизация на русском, английском и других языках"
              icon={Mic}
              delay={0.1}
            />
            <FeatureCard
              title="API интеграция"
              description="Готовые REST API для встраивания в ваши сервисы и приложения"
              icon={Cloud}
              delay={0.2}
            />
            <FeatureCard
              title="Высокая производительность"
              description="Обработка аудио в реальном времени с минимальной задержкой"
              icon={Gauge}
              delay={0.3}
            />
            <FeatureCard
              title="Логирование событий"
              description="Полный аудит всех действий с детализированными отчетами"
              icon={Clock}
              delay={0.4}
            />
            <FeatureCard
              title="Визуализация данных"
              description="Интерактивные дашборды для мониторинга анонимизации"
              icon={Shield}
              delay={0.5}
            />
            <FeatureCard
              title="Поддержка потоков"
              description="Работа с RTP-потоками для live-анонимизации"
              icon={Headphones}
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Data Types Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection direction="up" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-custom-main mb-4">
              Детектируемые типы данных
            </h2>
            <p className="text-custom-secondary max-w-2xl mx-auto">
              Автоматически обнаруживаем и удаляем следующие категории персональных данных
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Phone, label: "Телефоны" },
              { icon: Mail, label: "Email" },
              { icon: MapPin, label: "Адреса" },
              { icon: IdCard, label: "Паспорта" },
              { icon: Hash, label: "ИНН/СНИЛС" },
              { icon: Users, label: "ФИО" },
            ].map((item, idx) => (
              <AnimatedSection key={idx} delay={idx * 0.1} direction="up">
                <div className="flex flex-col items-center p-4 bg-custom-bg-secondary/30 rounded-[--radius-card] border border-custom-secondary/10 hover:border-custom-accent/30 transition-all duration-300">
                  <item.icon className="w-8 h-8 text-custom-accent mb-2" />
                  <span className="text-sm text-custom-main font-medium">{item.label}</span>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 bg-custom-bg-secondary/20">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection direction="up" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-custom-main mb-4">
              Кейсы использования
            </h2>
            <p className="text-custom-secondary max-w-2xl mx-auto">
              Где и как можно применять наш сервис
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatedSection direction="left" delay={0.2}>
              <div className="p-6 bg-custom-bg-secondary/40 rounded-[--radius-card] border border-custom-secondary/10">
                <Building2 className="w-8 h-8 text-custom-accent mb-4" />
                <h3 className="text-xl font-bold text-custom-main mb-2">Колл-центры</h3>
                <p className="text-custom-secondary">
                  Анонимизация записей разговоров операторов с клиентами для соблюдения 152-ФЗ и GDPR.
                  Автоматическое удаление паспортных данных, адресов и другой чувствительной информации.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right" delay={0.3}>
              <div className="p-6 bg-custom-bg-secondary/40 rounded-[--radius-card] border border-custom-secondary/10">
                <Mic className="w-8 h-8 text-custom-accent mb-4" />
                <h3 className="text-xl font-bold text-custom-main mb-2">Медицина и телемедицина</h3>
                <p className="text-custom-secondary">
                  Защита персональных медицинских данных при записи консультаций.
                  Соответствие требованиям HIPAA и другим отраслевым стандартам.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="left" delay={0.4}>
              <div className="p-6 bg-custom-bg-secondary/40 rounded-[--radius-card] border border-custom-secondary/10">
                <Shield className="w-8 h-8 text-custom-accent mb-4" />
                <h3 className="text-xl font-bold text-custom-main mb-2">Правоохранительные органы</h3>
                <p className="text-custom-secondary">
                  Безопасное хранение и передача аудиоматериалов с удалением конфиденциальных данных
                  третьих лиц, не участвующих в деле.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right" delay={0.5}>
              <div className="p-6 bg-custom-bg-secondary/40 rounded-[--radius-card] border border-custom-secondary/10">
                <Cloud className="w-8 h-8 text-custom-accent mb-4" />
                <h3 className="text-xl font-bold text-custom-main mb-2">Облачные сервисы</h3>
                <p className="text-custom-secondary">
                  Интеграция с CRM, биллинговыми системами и платформами для анализа звонков
                  без риска утечки персональных данных.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection direction="up">
            <div className="bg-custom-bg-secondary/40 backdrop-blur-sm rounded-[--radius-card] p-8 md:p-12 border border-custom-secondary/10">
              <h2 className="text-3xl md:text-4xl font-bold text-custom-main mb-4">
                Готовы защитить свои аудиоданные?
              </h2>
              <p className="text-custom-secondary mb-8 max-w-lg mx-auto">
                Присоединяйтесь к хакатону и получите доступ к демо-версии сервиса
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleRegister}
                  className="btn btn-primary gap-2 px-8 py-3 text-lg"
                  style={{ borderRadius: "var(--radius-button)" }}
                >
                  Зарегистрироваться
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollToSection("features")}
                  className="btn btn-secondary gap-2 px-8 py-3 text-lg"
                  style={{ borderRadius: "var(--radius-button)" }}
                >
                  Узнать больше
                  <Mail className="w-5 h-5" />
                </button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}