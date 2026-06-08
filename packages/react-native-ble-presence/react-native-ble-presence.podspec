require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |spec|
  spec.name         = "react-native-ble-presence"
  spec.version      = package["version"]
  spec.summary      = package["description"]
  spec.homepage     = "https://github.com/GuilhermeFrick/react-native-ble-presence"
  spec.license      = package["license"]
  spec.author       = "Guilherme Frick"
  spec.platforms    = { :ios => "13.0" }
  spec.source       = { :git => "https://github.com/GuilhermeFrick/react-native-ble-presence.git", :tag => spec.version.to_s }
  spec.source_files = "ios/**/*.{h,m,mm,swift}"

  spec.dependency "React-Core"
end
