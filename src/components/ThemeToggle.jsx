import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    const handleToggle = () => {
        toggleTheme();
    };

    return (
        <div
            className={`w-16 h-9 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${theme === "dark" ? "bg-slate-700 justify-end" : "bg-slate-200 justify-start"
                }`}
            onClick={handleToggle}
        >
            <motion.div
                layout
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(event, info) => {
                    // Check drag distance/velocity to trigger toggle
                    const swipeThreshold = 5;
                    if (theme === 'light' && info.offset.x > swipeThreshold) {
                        handleToggle();
                    } else if (theme === 'dark' && info.offset.x < -swipeThreshold) {
                        handleToggle();
                    }
                }}
                transition={{
                    type: "spring",
                    stiffness: 700,
                    damping: 30
                }}
                className={`w-7 h-7 rounded-full shadow-md flex items-center justify-center bg-white`}
            >
                {theme === "dark" ? (
                    <Moon size={14} className="text-slate-800" />
                ) : (
                    <Sun size={14} className="text-orange-500" />
                )}
            </motion.div>
        </div>
    );
};

export default ThemeToggle;
