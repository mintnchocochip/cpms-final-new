import { useRive } from "@rive-app/react-canvas";

const RiveAnimation = () => {
  const { rive, RiveComponent } = useRive({
    src: "../assets/login.riv", 
    stateMachines: "robot_login", 
    autoplay: true,
  });

  return (
    <div>
      <RiveComponent style={{ width: 300, height: 300 }} />
    </div>
  );
};

export default RiveAnimation;