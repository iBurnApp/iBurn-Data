import XCTest
@testable import iBurn2025APIData

final class BundleDebugTests: XCTestCase {
    
    func testBundleStructure() {
        let bundle = iBurn2025APIData.bundle
        
        guard let resourceURL = bundle.resourceURL else {
            XCTFail("Bundle should have a resource URL")
            return
        }
        
        print("Bundle resource URL: \(resourceURL)")
        
        do {
            let contents = try FileManager.default.contentsOfDirectory(at: resourceURL, includingPropertiesForKeys: nil, options: [])
            print("Bundle root contents:")
            for url in contents.sorted(by: { $0.path < $1.path }) {
                print("  \(url.lastPathComponent)")
                
                // If it's a directory, list its contents too
                var isDirectory: ObjCBool = false
                if FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) && isDirectory.boolValue {
                    do {
                        let subContents = try FileManager.default.contentsOfDirectory(at: url, includingPropertiesForKeys: nil, options: [])
                        for subURL in subContents.sorted(by: { $0.path < $1.path }) {
                            print("    \(subURL.lastPathComponent)")
                        }
                        
                        // If this is APIData directory, try to access art.json directly
                        if url.lastPathComponent == "APIData" {
                            let artURL = url.appendingPathComponent("art.json")
                            let exists = FileManager.default.fileExists(atPath: artURL.path)
                            print("    art.json exists: \(exists)")
                            if exists {
                                do {
                                    let data = try Data(contentsOf: artURL)
                                    print("    art.json size: \(data.count) bytes")
                                } catch {
                                    print("    Error reading art.json: \(error)")
                                }
                            }
                        }
                    } catch {
                        print("    Error reading subdirectory: \(error)")
                    }
                }
            }
        } catch {
            XCTFail("Failed to read bundle contents: \(error)")
        }
    }
    
    func testDirectFileAccess() {
        let bundle = iBurn2025APIData.bundle
        
        // Try different paths to find the files
        let testPaths = [
            "art.json",
            "APIData/art.json",
            "Sources/iBurn2025APIData/APIData/art.json"
        ]
        
        for path in testPaths {
            if let url = bundle.url(forResource: path, withExtension: nil) {
                print("Found file at path: \(path) -> \(url)")
            } else {
                print("File not found at path: \(path)")
            }
        }
        
        // Also try with subdirectory parameter
        if let url = bundle.url(forResource: "art", withExtension: "json", subdirectory: "APIData") {
            print("Found with subdirectory 'APIData': \(url)")
        } else {
            print("Not found with subdirectory 'APIData'")
        }
    }
}