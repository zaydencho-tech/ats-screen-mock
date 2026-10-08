import { CheckCircle } from "lucide-react";
import { motion } from "motion/react";

export default function ApplySubmittedStep() {
  return (
          <div className="min-h-[80vh] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-primary" />
              </div>
              <h2 className="font-display text-4xl mb-4 text-primary">지원이 완료되었습니다</h2>
              <p className="text-muted-foreground text-lg">
                검토 후 연락 드리겠습니다. 감사합니다.
              </p>
            </motion.div>
          </div>
  );
}
