import { imagearray } from "../lib/image";

const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-base-200 p-12">
      <div className="max-w-md text-center">
        <div className="grid grid-cols-3 gap-5 mb-8">
          {imagearray.map((el, i) => (
            <div
              key={i}
              className={`aspect-square rounded-2xl bg-primary/10 flex items-center justify-center relative overflow-hidden ${
                i%2 == 0 ? "animate-pulse":"animate-pulse"
              }`}
            >
              {/* Image */}
              <img
                src={el}
                alt=""
                className="rounded-full h-[7rem] w-[7rem] object-cover"
              />

              {/* Black overlay */}
              <div className="absolute inset-0 bg-black/20 rounded-full" />
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-base-content/60">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
